const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a la base de datos MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    // Llamar a la función testDB para comprobar la conexión con MongoDB
    testDB();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Función para comprobar la conexión a la base de datos con un console.log()
async function testDB() {
  try {
    // Comprobar la conexión a la base de datos enviando un ping
    await mongoose.connection.db.admin().ping();
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Definir el esquema del registro de actividad (log)
const logSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
});

// Definir el esquema principal del usuario
const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [logSchema] // Un array de registros de actividad
});

// Crear un modelo basado en el esquema del usuario
const User = mongoose.model('User', userSchema);


app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// Datos simulados de usuarios y ejercicios (solo para propósitos de demostración)
let users = [];
let exercises = [];

// Middleware para permitir solicitudes desde cualquier origen (CORS)
app.use(cors());

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Ruta para obtener la lista de usuarios
app.get('/api/users', async (req, res) => {
  try {
    // Buscar todos los usuarios en la base de datos
    const users = await User.find({}, { username: 1, _id: 1 });
    res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para crear un nuevo usuario
app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  try {
    // Verificar si el nombre de usuario ya existe en la base de datos
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Crear un nuevo usuario
    const newUser = new User({ username });
    await newUser.save();

    // Devolver solo las propiedades username y _id del usuario creado
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Ruta para agregar un ejercicio a un usuario específico
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  try {
    // Verificar si el usuario existe en la base de datos
    const user = await User.findById(_id).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Agregar el ejercicio al registro del usuario
    const formattedDate = date ? new Date(date).toDateString() : new Date().toDateString();
    user.log.push({ description, duration, date: formattedDate, _id });
    await User.updateOne({ _id }, { log: user.log });

    // Devolver el usuario actualizado sin el campo __v
    delete user.__v;

    // Formateamos la salida tal y como la esperan para testeo
    const exercise = {
      username: user.username,
      description,
      duration: Number(duration),
      date: formattedDate,
      _id: _id // Genera un nuevo ID para el ejercicio
    };

    console.log("Exercise:", exercise);
    res.json(exercise);
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Ruta para obtener el registro de ejercicios de un usuario
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  try {
    // Buscar el usuario por su ID en la base de datos
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Obtener los ejercicios del usuario
    let userExercises = user.log || [];

    // Filtrar por rango de fechas
    if (from) {
      userExercises = userExercises.filter(exercise => new Date(exercise.date) >= new Date(from));
    }
    if (to) {
      userExercises = userExercises.filter(exercise => new Date(exercise.date) <= new Date(to));
    }

    // Limitar la cantidad de registros
    if (limit) {
      userExercises = userExercises.slice(0, parseInt(limit));
    }

    // Convertir la propiedad date de cada ejercicio a una cadena en el formato dateString de la API Date
    userExercises = userExercises.map(exercise => ({ ...exercise.toObject(), date: new Date(exercise.date).toDateString() }));

    // Eliminar el campo "__v" del objeto de usuario
    delete user.__v;

    // Calcular el número de ejercicios
    const exerciseCount = userExercises.length;

    // Crear el objeto de usuario con la propiedad count
    const userWithCount = { ...user.toObject(), count: exerciseCount, log: userExercises };

    console.log("User with count", userWithCount);

    // Devolver el objeto de usuario con la propiedad count y la propiedad date convertida a una cadena
    res.json(userWithCount);
  } catch (error) {
    console.error("Error getting user's exercises:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
