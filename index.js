const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

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


// Simulación de una base de datos de usuarios
const usersDatabase = [
  {
    username: "fcc_test",
    _id: "5fb5853f734231456ccb3b05",
    count: 1,
    log: [{
      description: "test",
      duration: 60,
      date: new Date("Mon Jan 01 1990").toDateString(),
    }]
  },
  {
    username: "otro_usuario",
    _id: "5fb5853f734231456ccb3b06",
    count: 2,
    log: [{
      description: "prueba",
      duration: 45,
      date: new Date("Tue Jan 02 1990").toDateString(),
    },
    {
      description: "ejemplo",
      duration: 30,
      date: new Date("Wed Jan 03 1990").toDateString(),
    }]
  }
];

// Ruta para obtener la lista de usuarios
app.get('/api/users', function (req, res) {
  // Mapear cada usuario para devolver solo username y _id
  const users = usersDatabase.map(user => ({ username: user.username, _id: user._id }));
  res.json(users);
});

// Ruta para crear un nuevo usuario
app.post('/api/users', (req, res) => {
  const { username } = req.body;

  // Verificar si el nombre de usuario ya existe
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Crear un nuevo usuario
  const newUser = {
    username,
    _id: users.length + 1, // Se simula un ID único, podría ser generado automáticamente
  };
  users.push(newUser);
  res.json(newUser);
});

// Ruta para agregar un ejercicio a un usuario específico
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Verificar si el usuario existe
  const user = users.find(user => user._id == _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Agregar el ejercicio al registro
  const newExercise = {
    userId: user._id,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date(),
  };
  exercises.push(newExercise);
  res.json(newExercise);
});

// Ruta para obtener el registro de ejercicios de un usuario
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  // Filtrar ejercicios por usuario
  let userExercises = exercises.filter(exercise => exercise.userId == _id);

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

  res.json(userExercises);
});







const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
