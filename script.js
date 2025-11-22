// Replace the following with your Firebase config
const firebaseConfig = {
	apiKey: "AIzaSyBO8OQBYVK7D4ic7AABiVuUCXMgoHY5hHM",
	authDomain: "chat-c3a67.firebaseapp.com",
	databaseURL: "https://chat-c3a67-default-rtdb.firebaseio.com",
	projectId: "chat-c3a67",
	storageBucket: "chat-c3a67.appspot.com",
	messagingSenderId: "350872002078",
	appId: "1:350872002078:web:5e990c0043795f300b580f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const usersRef = db.ref("users");
const messagesRef = db.ref("messages");

let currentUsername = null;

// Sign Up function with bcrypt password hashing
function signUp() {
	console.log("Sign Up clicked"); // Debugging
	const username = document.getElementById("username").value.trim();
	const password = document.getElementById("password").value;

	if (!username || !password) {
		showAuthStatus("Username and password required.");
		return;
	}

	usersRef
		.child(username)
		.get()
		.then((snapshot) => {
			if (snapshot.exists()) {
				showAuthStatus("Username is already taken.");
			} else {
				bcrypt.hash(password, 10, function (err, hash) {
					if (err) {
						showAuthStatus("Error hashing password.");
						return;
					}
					auth
						.signInAnonymously()
						.then((userCredential) => {
							const uid = userCredential.user.uid;
							usersRef
								.child(username)
								.set({
									passwordHash: hash,
									uid: uid
								})
								.then(() => {
									currentUsername = username;
									switchToChatUI();
									showAuthStatus("Sign up and login successful!");
								})
								.catch((dbError) => {
									showAuthStatus("Database error: " + dbError.message);
								});
						})
						.catch((error) => {
							showAuthStatus("Firebase auth error: " + error.message);
						});
				});
			}
		})
		.catch((error) => {
			showAuthStatus("Database error (username lookup): " + error.message);
		});
}

// Login function validating password using bcrypt compare
function login() {
	console.log("Login clicked"); // Debugging
	const username = document.getElementById("username").value.trim();
	const password = document.getElementById("password").value;

	if (!username || !password) {
		showAuthStatus("Username and password required.");
		return;
	}

	usersRef
		.child(username)
		.get()
		.then((snapshot) => {
			if (!snapshot.exists()) {
				showAuthStatus("User not found.");
				return;
			}
			const data = snapshot.val();
			const storedHash = data.passwordHash;

			bcrypt.compare(password, storedHash, function (err, res) {
				if (err) {
					showAuthStatus("Hash compare error: " + err.message);
					return;
				}
				if (res) {
					auth
						.signInAnonymously()
						.then((userCredential) => {
							currentUsername = username;
							switchToChatUI();
							showAuthStatus("Login successful!");
						})
						.catch((error) => {
							showAuthStatus("Firebase auth error: " + error.message);
						});
				} else {
					showAuthStatus("Incorrect password.");
				}
			});
		})
		.catch((error) => {
			showAuthStatus("Database error (username lookup): " + error.message);
		});
}

// Show authentication status messages
function showAuthStatus(message) {
	document.getElementById("auth-status").textContent = message;
}

// Switch UI to Chat
function switchToChatUI() {
	document.getElementById("auth-section").style.display = "none";
	document.getElementById("chat-section").style.display = "block";
	document.getElementById("user-info").textContent = currentUsername;
	loadMessages();
}

// Logout
function logout() {
	auth.signOut();
	currentUsername = null;
	document.getElementById("auth-section").style.display = "block";
	document.getElementById("chat-section").style.display = "none";
	showAuthStatus("");
	clearMessages();
}

// Listen to Firebase auth state change to handle logout externally if needed
auth.onAuthStateChanged((user) => {
	if (!user) {
		logout();
	}
});

// Send message
function sendMessage(e) {
	e.preventDefault();
	const text = document.getElementById("message-input").value.trim();
	if (!text) return;
	messagesRef.push({
		sender: currentUsername,
		text: text,
		timestamp: firebase.database.ServerValue.TIMESTAMP
	});
	document.getElementById("message-input").value = "";
}

// Load and display messages from Firebase Realtime Database
function loadMessages() {
	clearMessages();
	messagesRef.off();
	messagesRef.on("child_added", (snapshot) => {
		const msg = snapshot.val();
		displayMessage(msg);
	});
}

// Clear messages display
function clearMessages() {
	const container = document.getElementById("messages-container");
	container.innerHTML = "";
}

// Display message
function displayMessage(message) {
	const container = document.getElementById("messages-container");
	const time = new Date(message.timestamp).toLocaleTimeString();
	const div = document.createElement("div");
	div.classList.add("message");
	div.textContent = `[${time}] ${message.sender}: ${message.text}`;
	container.appendChild(div);
	container.scrollTop = container.scrollHeight;
}

// Optional: Add try/catch to window.onerror for easier debugging
window.onerror = function (message, source, lineno, colno, error) {
	showAuthStatus("JS Error: " + message);
};