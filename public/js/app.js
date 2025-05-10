
// Firebase configuration
// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference to auth and database
const auth = firebase.auth();
const database = firebase.database();

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.navigation');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      navigation.classList.toggle('active');
      
      // Change hamburger to X
      const spans = menuToggle.querySelectorAll('span');
      if (navigation.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const userType = document.querySelector('input[name="userType"]:checked').value;
      
      // Sign in with email and password
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Check user type from database
          const userId = userCredential.user.uid;
          
          database.ref('users/' + userId).once('value')
            .then((snapshot) => {
              const userData = snapshot.val();
              
              if (userData && userData.userType === userType) {
                // Redirect to appropriate dashboard
                window.location.href = userType === 'doctor' ? 'doctor-dashboard.html' : 'patient-dashboard.html';
              } else {
                alert('Invalid user type. Please select the correct user type.');
              }
            })
            .catch((error) => {
              console.error("Error getting user data:", error);
              alert("Error logging in: " + error.message);
            });
        })
        .catch((error) => {
          console.error("Login error:", error);
          alert("Login failed: " + error.message);
        });
    });
  }
  
  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const userType = document.querySelector('input[name="userType"]:checked').value;
      
      if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
      }
      
      // Create user with email and password
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const userId = userCredential.user.uid;
          
          // Save additional user data
          database.ref('users/' + userId).set({
            name: name,
            email: email,
            userType: userType,
            createdAt: new Date().toString()
          })
            .then(() => {
              alert('Account created successfully');
              window.location.href = userType === 'doctor' ? 'doctor-dashboard.html' : 'patient-dashboard.html';
            })
            .catch((error) => {
              console.error("Database error:", error);
              alert("Error saving user data: " + error.message);
            });
        })
        .catch((error) => {
          console.error("Signup error:", error);
          alert("Signup failed: " + error.message);
        });
    });
  }
  
  // Patient form submission
  const patientIssueForm = document.getElementById('patientIssueForm');
  if (patientIssueForm) {
    patientIssueForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check if user is logged in
      const user = auth.currentUser;
      if (!user) {
        alert('Please log in first');
        window.location.href = 'login.html';
        return;
      }
      
      const name = document.getElementById('name').value;
      const age = document.getElementById('age').value;
      const gender = document.getElementById('gender').value;
      const phone = document.getElementById('phone').value;
      const issue = document.getElementById('issue').value;
      
      // Generate a unique key for the new issue
      const newIssueKey = database.ref().child('issues').push().key;
      
      const issueData = {
        patientId: user.uid,
        name: name,
        age: age,
        gender: gender,
        phone: phone,
        issue: issue,
        status: 'pending',
        createdAt: new Date().toString()
      };
      
      // Write to database
      database.ref('issues/' + newIssueKey).set(issueData)
        .then(() => {
          alert('Your health issue has been submitted successfully!');
          patientIssueForm.reset();
        })
        .catch((error) => {
          console.error("Error submitting issue:", error);
          alert("Error submitting issue: " + error.message);
        });
    });
  }
  
  // Load patient issues for doctor
  const patientIssuesList = document.getElementById('patientIssuesList');
  if (patientIssuesList) {
    // Check if user is logged in and is a doctor
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    // Verify user is a doctor
    database.ref('users/' + user.uid).once('value')
      .then((snapshot) => {
        const userData = snapshot.val();
        if (!userData || userData.userType !== 'doctor') {
          alert('Access denied. Only doctors can view this page.');
          window.location.href = 'login.html';
          return;
        }
        
        // Load all patient issues
        database.ref('issues').orderByChild('status').equalTo('pending')
          .on('value', (snapshot) => {
            patientIssuesList.innerHTML = '';
            
            if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                const issueKey = childSnapshot.key;
                const issue = childSnapshot.val();
                
                const issueCard = document.createElement('div');
                issueCard.className = 'issue-card';
                issueCard.innerHTML = `
                  <h4>${issue.name}, ${issue.age}, ${issue.gender}</h4>
                  <p><strong>Phone:</strong> ${issue.phone}</p>
                  <p><strong>Issue:</strong> ${issue.issue}</p>
                  <p><strong>Date:</strong> ${new Date(issue.createdAt).toLocaleDateString()}</p>
                  <div class="doctor-response">
                    <textarea id="response-${issueKey}" placeholder="Write your prescription/response here..."></textarea>
                    <button class="btn btn-primary respond-btn" data-issue-id="${issueKey}">Send Response</button>
                  </div>
                `;
                
                patientIssuesList.appendChild(issueCard);
              });
              
              // Add event listeners to all respond buttons
              document.querySelectorAll('.respond-btn').forEach(button => {
                button.addEventListener('click', function() {
                  const issueId = this.getAttribute('data-issue-id');
                  const responseText = document.getElementById(`response-${issueId}`).value;
                  
                  if (responseText.trim() === '') {
                    alert('Please write a response before sending');
                    return;
                  }
                  
                  // Update the issue with doctor's response
                  database.ref('issues/' + issueId).update({
                    doctorResponse: responseText,
                    respondedBy: user.uid,
                    respondedAt: new Date().toString(),
                    status: 'responded'
                  })
                    .then(() => {
                      alert('Response sent successfully');
                    })
                    .catch((error) => {
                      console.error("Error sending response:", error);
                      alert("Error sending response: " + error.message);
                    });
                });
              });
            } else {
              patientIssuesList.innerHTML = '<p>No pending issues found.</p>';
            }
          });
      })
      .catch((error) => {
        console.error("Error verifying doctor:", error);
        alert("Error accessing page: " + error.message);
      });
  }
  
  // Load patient's own issues and doctor responses
  const myIssuesList = document.getElementById('myIssuesList');
  if (myIssuesList) {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in first');
      window.location.href = 'login.html';
      return;
    }
    
    // Load issues for this patient
    database.ref('issues').orderByChild('patientId').equalTo(user.uid)
      .on('value', (snapshot) => {
        myIssuesList.innerHTML = '';
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const issue = childSnapshot.val();
            
            const issueCard = document.createElement('div');
            issueCard.className = 'issue-card';
            
            let statusClass = 'status-pending';
            if (issue.status === 'responded') {
              statusClass = 'status-responded';
            }
            
            let responseHtml = '';
            if (issue.status === 'responded') {
              responseHtml = `
                <div class="doctor-response-box">
                  <h5>Doctor's Response:</h5>
                  <p>${issue.doctorResponse}</p>
                  <p class="response-date">Received on ${new Date(issue.respondedAt).toLocaleDateString()}</p>
                </div>
              `;
            } else {
              responseHtml = `<p class="pending-message">Waiting for doctor's response...</p>`;
            }
            
            issueCard.innerHTML = `
              <div class="issue-header">
                <h4>${issue.issue}</h4>
                <span class="status ${statusClass}">${issue.status}</span>
              </div>
              <p class="issue-date">Submitted on ${new Date(issue.createdAt).toLocaleDateString()}</p>
              ${responseHtml}
            `;
            
            myIssuesList.appendChild(issueCard);
          });
        } else {
          myIssuesList.innerHTML = '<p>You haven\'t submitted any health issues yet.</p>';
        }
      });
  }
  
  // Contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      
      // Save message to database
      database.ref('contacts').push({
        name: name,
        email: email,
        message: message,
        createdAt: new Date().toString()
      })
        .then(() => {
          alert('Thank you for your message. We will get back to you soon!');
          contactForm.reset();
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          alert("Error sending message: " + error.message);
        });
    });
  }
  
  // Check if user is logged in on page load
  auth.onAuthStateChanged(function(user) {
    const loginButtons = document.querySelectorAll('.auth-buttons');
    
    if (user) {
      // User is signed in
      if (loginButtons.length > 0) {
        loginButtons.forEach(div => {
          div.innerHTML = `
            <a href="#" id="logout-btn" class="btn btn-outline">Logout</a>
            <a href="dashboard.html" class="btn btn-primary">Dashboard</a>
          `;
        });
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            auth.signOut()
              .then(() => {
                window.location.href = 'index.html';
              })
              .catch((error) => {
                console.error("Error signing out:", error);
                alert("Error signing out: " + error.message);
              });
          });
        }
      }
    }
  });
});
