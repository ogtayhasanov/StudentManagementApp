const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost/student_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// Student Schema
const studentSchema = new mongoose.Schema({
  name: String,
  age: Number,
  courses: [
    {
      courseId: String,
      courseName: String,
      grade: String,
    },
  ],
});

const User = mongoose.model('User', userSchema);
const Student = mongoose.model('Student', studentSchema);

// Registration Endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Students Endpoint
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error });
  }
});

// Add Student Endpoint
app.post('/students', async (req, res) => {
  const { name, age } = req.body;

  try {
    const newStudent = new Student({ name, age, courses: [] });
    await newStudent.save();
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error adding student', error });
  }
});

// Delete Student Endpoint
app.delete('/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error });
  }
});

// Fetch Student Details Endpoint
app.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student details', error });
  }
});

// Fetch Student Courses Endpoint
app.get('/students/:id/courses', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student.courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student courses', error });
  }
});

// Add Course to Student Endpoint
app.post('/students/:id/courses', async (req, res) => {
  const { courseId, courseName, grade } = req.body;

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.courses.push({ courseId, courseName, grade });
    await student.save();
    res.status(201).json(student.courses);
  } catch (error) {
    res.status(500).json({ message: 'Error adding course', error });
  }
});

// Edit Course Endpoint
app.put('/students/:id/courses/:courseId', async (req, res) => {
  const { grade } = req.body;

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const course = student.courses.find(course => course.courseId === req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.grade = grade;
    await student.save();
    res.status(200).json(student.courses);
  } catch (error) {
    res.status(500).json({ message: 'Error updating course', error });
  }
});

// Delete Course Endpoint
app.delete('/students/:id/courses/:courseId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.courses = student.courses.filter(course => course.courseId !== req.params.courseId);
    await student.save();
    res.status(200).json(student.courses);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error });
  }
});

// Start the server
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
