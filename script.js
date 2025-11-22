const firebaseConfig = {
	apiKey: "AIzaSyBO8OQBYVK7D4ic7AABiVuUCXMgoHY5hHM",
	authDomain: "chat-c3a67.firebaseapp.com",
	databaseURL: "https://chat-c3a67-default-rtdb.firebaseio.com",
	projectId: "chat-c3a67",
	storageBucket: "chat-c3a67.appspot.com",
	messagingSenderId: "350872002078",
	appId: "1:350872002078:web:5e990c0043795f300b580f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const usersRef = db.ref("users");
const messagesRef = db.ref("messages");

// Make bcrypt available globally
window.bcrypt = window.bcrypt || (window.dcodeIO && window.dcodeIO.bcrypt);

let currentUsername = null;

// Restore session from localStorage on page load
window.onload = function () {
	const savedUsername = localStorage.getItem("chatUsername");
	if (savedUsername) {
		// Double-check that user still exists
		usersRef.child(savedUsername).get().then(snapshot => {
			if (snapshot.exists()) {
				currentUsername = savedUsername;
				switchToChatUI();
				showAuthStatus("Session restored for " + currentUsername);
			} else {
				localStorage.removeItem("chatUsername");
			}
		});
	}
};

// Sign Up logic with bcrypt
function signUp() {
	console.log("Sign Up clicked");
	const username = document.getElementById("username").value.trim();
	const password = document.getElementById("password").value;
	if (!username || !password) {
		showAuthStatus("Username and password required.");
		return;
	}
	usersRef.child(username).get()
		.then(snapshot => {
			if (snapshot.exists()) {
				showAuthStatus("Username is already taken.");
			} else {
				bcrypt.hash(password, 10, function (err, hash) {
					if (err) {
						showAuthStatus("Error hashing password.");
						return;
					}
					usersRef.child(username).set({
						passwordHash: hash
					})
						.then(() => {
							currentUsername = username;
							localStorage.setItem("chatUsername", currentUsername);
							switchToChatUI();
							showAuthStatus("Sign up and login successful!");
						})
						.catch(dbError => {
							showAuthStatus("Database error: " + dbError.message);
						});
				});
			}
		})
	usersRef.child(username).set({
		passwordHash: hash
	})
		.then(() => {
			currentUsername = username;
			localStorage.setItem("chatUsername", currentUsername);
			switchToChatUI();
			showAuthStatus("Sign up and login successful! Your password is securely encrypted before being stored.");
		})
		.catch(error => {
			showAuthStatus("Database error (username lookup): " + error.message);
		});
}

// Login logic with bcrypt
function login() {
	console.log("Login clicked");
	const username = document.getElementById("username").value.trim();
	const password = document.getElementById("password").value;
	if (!username || !password) {
		showAuthStatus("Username and password required.");
		return;
	}
	usersRef.child(username).get()
		.then(snapshot => {
			if (!snapshot.exists()) {
				showAuthStatus("User not found.");
				return;
			}
			const storedHash = snapshot.val().passwordHash;
			bcrypt.compare(password, storedHash, function (err, res) {
				if (err) {
					showAuthStatus("Hash compare error: " + err.message);
					return;
				}
				if (res) {
					currentUsername = username;
					localStorage.setItem("chatUsername", currentUsername);
					switchToChatUI();
					showAuthStatus("Login successful!");
				} else {
					showAuthStatus("Incorrect password.");
				}
			});
		})
		.catch(error => {
			showAuthStatus("Database error (username lookup): " + error.message);
		});
}

function showAuthStatus(message) {
	document.getElementById("auth-status").textContent = message;
}

function switchToChatUI() {
	document.getElementById("auth-section").style.display = "none";
	document.getElementById("chat-section").style.display = "block";
	document.getElementById("user-info").textContent = currentUsername;
	loadMessages();
}

function logout() {
	currentUsername = null;
	localStorage.removeItem("chatUsername");
	document.getElementById("auth-section").style.display = "block";
	document.getElementById("chat-section").style.display = "none";
	showAuthStatus("");
	clearMessages();
}

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

function loadMessages() {
	clearMessages();
	messagesRef.off();
	messagesRef.on("child_added", snapshot => {
		const msg = snapshot.val();
		displayMessage(msg);
	});
}

function clearMessages() {
	const container = document.getElementById("messages-container");
	container.innerHTML = "";
}

function displayMessage(message) {
	const container = document.getElementById("messages-container");
	const time = new Date(message.timestamp).toLocaleTimeString();
	const div = document.createElement("div");
	div.classList.add("message");
	div.textContent = `[${time}] ${message.sender}: ${message.text}`;
	container.appendChild(div);
	container.scrollTop = container.scrollHeight;
}

// Optional error debugging
window.onerror = function (message, source, lineno, colno, error) {
	showAuthStatus("JS Error: " + message);
};
