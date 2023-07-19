const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
// const functions = require('firebase-functions');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Middleware to validate student data for PUT and POST requests
const validateStudentData = (req, res, next) => {
    const { student_name, student_dob, student_gender, student_email, student_phone } = req.body;

    // Check if student_name is not empty
    if (!student_name) {
      return res.status(400).send('Invalid student name');
    }

    // Check if student_dob is a valid date and not in the future
    const dobDate = new Date(student_dob);
    const currentDate = new Date();
    if (isNaN(dobDate) || dobDate > currentDate) {
      return res.status(400).send('Invalid date of birth');
    }

    // Check if student_gender is either 'Male', 'Female', or 'Other'
    if (!['Male', 'Female', 'Other'].includes(student_gender)) {
      return res.status(400).send('Invalid student gender');
    }

    // Check if student_email is a valid email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!student_email || !emailRegex.test(student_email)) {
      return res.status(400).send('Invalid email address');
    }

    // Check if student_phone is a 10-digit number
    const phoneRegex = /^\d{10}$/;
    if (!student_phone || !phoneRegex.test(student_phone)) {
      return res.status(400).send('Invalid phone number');
    }

    // If all validations pass, move to the next middleware
    next();
  };

// 1. GET /students/ - Returns all students data
app.get('/students', async (req, res) => {
  try {
    const studentsSnapshot = await db.collection('students').get();
    const studentsData = [];
    studentsSnapshot.forEach((doc) => {
      studentsData.push({ id: doc.id, ...doc.data() });
    });
    res.json(studentsData);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).send('Error fetching students');
  }
});

// 2. GET /students/<docid> - Return 1 student data specified as docid
app.get('/students/:docid', async (req, res) => {
  try {
    const { docid } = req.params;
    const studentSnapshot = await db.collection('students').doc(docid).get();

    if (!studentSnapshot.exists) {
      return res.status(404).send('Student not found');
    }

    const studentData = studentSnapshot.data();
    res.json({ id: studentSnapshot.id, ...studentData });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).send('Error fetching student');
  }
});

// 3. PUT /students/ - Create record in Firestore database
app.put('/students', validateStudentData,async (req, res) => {
  try {
    const { student_name, student_dob, student_gender, student_email, student_phone } = req.body;
    console.log(req.body)
    const docRef = await db.collection('students').add({
      student_name,
      student_dob,
      student_gender,
      student_email,
      student_phone,
    });
    res.json({ id: docRef.id });
  } catch (error) {
    console.error('Error creating student record:', error);
    res.status(500).send('Error creating student record');
  }
});

// 4. POST /students/<docid> - Update student record
app.post('/students/:docid', validateStudentData,async (req, res) => {
  try {
    const { docid } = req.params;
    const { student_name, student_dob, student_gender, student_email, student_phone } = req.body;

    await db.collection('students').doc(docid).set({
      student_name,
      student_dob,
      student_gender,
      student_email,
      student_phone,
    });

    res.json({ message: 'Student record updated successfully' });
  } catch (error) {
    console.error('Error updating student record:', error);
    res.status(500).send('Error updating student record');
  }
});

// 5. DELETE /students/<docid> remove student record
app.delete('/students/:docid', async (req, res) => {
  try {
    const { docid } = req.params;

    await db.collection('students').doc(docid).delete();
    res.json({ message: 'Student record deleted successfully' });
  } catch (error) {
    console.error('Error deleting student record:', error);
    res.status(500).send('Error deleting student record');
  }
});
app.get('/',(req,res)=>{
    res.send('Welcome to home page')
})

// Export the API as a Firebase function
// exports.api = functions.https.onRequest(app);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

