// Firebase Configuration - Replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyAm_1DYjwU4fG5hq2GDFm6oGkxbZkto6U4",
  authDomain: "freelancer-v1.firebaseapp.com",
  projectId: "freelancer-v1",
  storageBucket: "freelancer-v1.firebasestorage.app",
  messagingSenderId: "481916273727",
  appId: "1:481916273727:web:320d5b60f5c8764567248a",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global State
let currentUserId = null;
let expensesListener = null;
let projectsListener = null;
let clientsListener = null;
let financialChart = null;
let detailedFinancialChart = null;
let expensesData = [];
let projectsData = [];
let clientsData = [];
let currentView = "dashboard";

// Toast Notification System
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  const bgColor =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-indigo-500";
  toast.className = `toast ${bgColor} text-white px-6 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2`;

  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Animation Helper
function animateElement(element, animationClass) {
  element.classList.remove(animationClass);
  void element.offsetWidth; // Trigger reflow
  element.classList.add(animationClass);
}

// Authentication Functions
// Auth Form Switching Functions
function showLogin() {
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("forgot-password-form").classList.add("hidden");
}

function showSignUp() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("signup-form").classList.remove("hidden");
  document.getElementById("forgot-password-form").classList.add("hidden");
}

function showForgotPassword() {
  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("forgot-password-form").classList.remove("hidden");
}

// Login Function
function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("Please enter email and password", "error");
    return;
  }

  document.getElementById("login-form").classList.add("hidden");
  document.getElementById("auth-loading").classList.remove("hidden");

  auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      showToast("Successfully signed in!", "success");
    })
    .catch((error) => {
      document.getElementById("login-form").classList.remove("hidden");
      document.getElementById("auth-loading").classList.add("hidden");

      let errorMessage = "An error occurred";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid credentials";
      } else {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    });
}

// Sign Up Function
function handleSignUp() {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById(
    "signup-confirm-password",
  ).value;

  if (!email || !password || !confirmPassword) {
    showToast("Please fill in all fields", "error");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error");
    return;
  }

  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("auth-loading").classList.remove("hidden");

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      showToast("Account created successfully!", "success");
    })
    .catch((error) => {
      document.getElementById("signup-form").classList.remove("hidden");
      document.getElementById("auth-loading").classList.add("hidden");

      let errorMessage = "An error occurred";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    });
}

// Forgot Password Function
function handleForgotPassword() {
  const email = document.getElementById("forgot-email").value.trim();

  if (!email) {
    showToast("Please enter your email", "error");
    return;
  }

  document.getElementById("forgot-password-form").classList.add("hidden");
  document.getElementById("auth-loading").classList.remove("hidden");

  auth
    .sendPasswordResetEmail(email)
    .then(() => {
      document.getElementById("auth-loading").classList.add("hidden");
      document.getElementById("login-form").classList.remove("hidden");
      showToast("Password reset email sent! Check your inbox.", "success");
    })
    .catch((error) => {
      document
        .getElementById("forgot-password-form")
        .classList.remove("hidden");
      document.getElementById("auth-loading").classList.add("hidden");

      let errorMessage = "An error occurred";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    });
}

function handleLogout() {
  auth
    .signOut()
    .then(() => {
      showToast("Signed out successfully", "success");
    })
    .catch((error) => {
      showToast("Error signing out", "error");
    });
}

// Quick Action Menu
function toggleQuickActionMenu() {
  const menu = document.getElementById("quick-action-menu");
  menu.classList.toggle("hidden");
}

// Sidebar Toggle for Mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("-translate-x-full");
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
    document.getElementById("auth-screen").classList.add("hidden");
    document.getElementById("workspace").classList.remove("hidden");
    document.getElementById("user-email").textContent = user.email;

    // Initialize real-time listeners
    initializeExpensesListener();
    initializeProjectsListener();
    initializeClientsListener();
    initializeFinancialChart();
    initializeDetailedFinancialChart();
  } else {
    currentUserId = null;
    document.getElementById("auth-screen").classList.remove("hidden");
    document.getElementById("workspace").classList.add("hidden");
    document.getElementById("auth-form").classList.remove("hidden");
    document.getElementById("auth-loading").classList.add("hidden");

    // Cleanup listeners
    if (expensesListener) expensesListener();
    if (projectsListener) projectsListener();
    if (clientsListener) clientsListener();

    expensesData = [];
    projectsData = [];
    clientsData = [];
  }
});

// View Switching Function
function switchView(viewName) {
  currentView = viewName;

  // Hide all views
  document.querySelectorAll(".view-container").forEach((view) => {
    view.classList.add("hidden");
  });

  // Show selected view
  document.getElementById(`view-${viewName}`).classList.remove("hidden");

  // Update navigation buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.getElementById(`nav-${viewName}`).classList.add("active");

  // Initialize chart when switching to financials view
  if (viewName === "financials" && detailedFinancialChart) {
    updateDetailedFinancialChart();
  }
}

// Expense Functions
function initializeExpensesListener() {
  expensesListener = db
    .collection("users")
    .doc(currentUserId)
    .collection("expenses")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        expensesData = [];
        snapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() });
        });
        renderExpenses();
        updateFinancialSummary();
      },
      (error) => {
        console.error("Error listening to expenses:", error);
      },
    );
}

function addExpense() {
  const name = document.getElementById("expense-name").value.trim();
  const amount = parseFloat(document.getElementById("expense-amount").value);

  if (!name || isNaN(amount) || amount <= 0) {
    showToast("Please enter valid expense name and amount", "error");
    return;
  }

  db.collection("users")
    .doc(currentUserId)
    .collection("expenses")
    .add({
      name: name,
      amount: amount,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      document.getElementById("expense-name").value = "";
      document.getElementById("expense-amount").value = "";
      showToast("Expense added successfully!", "success");
    })
    .catch((error) => {
      showToast("Error adding expense", "error");
    });
}

function deleteExpense(expenseId) {
  db.collection("users")
    .doc(currentUserId)
    .collection("expenses")
    .doc(expenseId)
    .delete()
    .then(() => {
      showToast("Expense deleted", "success");
    })
    .catch((error) => {
      showToast("Error deleting expense", "error");
    });
}

function renderExpenses() {
  const container = document.getElementById("expenses-list");
  const totalExpensesEl = document.getElementById("total-expenses");

  if (expensesData.length === 0) {
    container.innerHTML =
      '<p class="text-slate-500 text-center py-4">No items yet. Click the (+) button to add your first one!</p>';
    totalExpensesEl.textContent = "$0";
    return;
  }

  let total = 0;
  container.innerHTML = "";

  expensesData.forEach((expense, index) => {
    total += expense.amount;

    const expenseEl = document.createElement("div");
    expenseEl.className =
      "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg animate-slide-in";
    expenseEl.style.animationDelay = `${index * 0.05}s`;

    expenseEl.innerHTML = `
            <div class="flex-1">
                <p class="text-slate-100 font-medium">${expense.name}</p>
                <p class="text-slate-400 text-sm">$${expense.amount.toFixed(2)}</p>
            </div>
            <button onclick="deleteExpense('${expense.id}')" 
                    class="btn-danger p-2 rounded-lg text-sm font-medium">
                Delete
            </button>
        `;

    container.appendChild(expenseEl);
  });

  totalExpensesEl.textContent = `$${total.toFixed(2)}`;
}

// Project Functions
function initializeProjectsListener() {
  projectsListener = db
    .collection("users")
    .doc(currentUserId)
    .collection("projects")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        projectsData = [];
        snapshot.forEach((doc) => {
          projectsData.push({ id: doc.id, ...doc.data() });
        });
        renderProjects();
        updateFinancialSummary();
      },
      (error) => {
        console.error("Error listening to projects:", error);
      },
    );
}

function openProjectModal() {
  document.getElementById("project-modal").classList.remove("hidden");
  document.getElementById("project-modal").classList.add("flex");
}

function closeProjectModal() {
  document.getElementById("project-modal").classList.add("hidden");
  document.getElementById("project-modal").classList.remove("flex");
  document.getElementById("project-client").value = "";
  document.getElementById("project-value").value = "";
  document.getElementById("project-hours").value = "";
  document.getElementById("project-status").value = "lead";
}

function addProject() {
  const client = document.getElementById("project-client").value.trim();
  const value = parseFloat(document.getElementById("project-value").value);
  const hours = parseFloat(document.getElementById("project-hours").value);
  const status = document.getElementById("project-status").value;

  if (!client || isNaN(value) || value <= 0 || isNaN(hours) || hours <= 0) {
    showToast("Please fill in all project fields", "error");
    return;
  }

  db.collection("users")
    .doc(currentUserId)
    .collection("projects")
    .add({
      client: client,
      value: value,
      hours: hours,
      status: status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      closeProjectModal();
      showToast("Project added successfully!", "success");
    })
    .catch((error) => {
      showToast("Error adding project", "error");
    });
}

function deleteProject(projectId) {
  db.collection("users")
    .doc(currentUserId)
    .collection("projects")
    .doc(projectId)
    .delete()
    .then(() => {
      showToast("Project deleted", "success");
    })
    .catch((error) => {
      showToast("Error deleting project", "error");
    });
}

function toggleProjectStatus(projectId, currentStatus) {
  const statusOrder = ["lead", "proposal", "active", "completed"];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const nextIndex = (currentIndex + 1) % statusOrder.length;
  const nextStatus = statusOrder[nextIndex];

  db.collection("users")
    .doc(currentUserId)
    .collection("projects")
    .doc(projectId)
    .update({
      status: nextStatus,
    })
    .then(() => {
      showToast(`Status updated to ${nextStatus}`, "success");
    })
    .catch((error) => {
      showToast("Error updating status", "error");
    });
}

function generateInvoice(projectId) {
  const project = projectsData.find((p) => p.id === projectId);
  if (!project) return;

  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const invoiceText = `
INVOICE
=======
Date: ${invoiceDate}
Client: ${project.client}

Project Details:
- Project Value: $${project.value.toFixed(2)}
- Estimated Hours: ${project.hours}
- Hourly Rate: $${(project.value / project.hours).toFixed(2)}

TOTAL DUE: $${project.value.toFixed(2)}

Thank you for your business!
    `.trim();

  navigator.clipboard
    .writeText(invoiceText)
    .then(() => {
      showToast("Invoice copied to clipboard!", "success");
    })
    .catch((error) => {
      showToast("Error copying invoice", "error");
    });
}

function getStatusBadge(status) {
  const statusColors = {
    lead: "bg-slate-500",
    proposal: "bg-amber-500",
    active: "bg-emerald-500",
    completed: "bg-indigo-500",
  };

  const color = statusColors[status] || "bg-slate-500";
  return `<span class="status-badge ${color} px-3 py-1 rounded-full text-xs font-semibold uppercase">${status}</span>`;
}

function renderProjects() {
  const container = document.getElementById("projects-list");

  if (projectsData.length === 0) {
    container.innerHTML =
      '<p class="text-slate-500 text-center py-8">No items yet. Click the (+) button to add your first one!</p>';
    return;
  }

  container.innerHTML = "";

  projectsData.forEach((project, index) => {
    const projectEl = document.createElement("div");
    projectEl.className = "p-4 bg-slate-800/50 rounded-lg animate-slide-in";
    projectEl.style.animationDelay = `${index * 0.05}s`;

    // Check if there's an active session for this project
    const activeSession = localStorage.getItem(`activeSession_${project.id}`);
    let sessionButton = "";

    if (activeSession) {
      const sessionData = JSON.parse(activeSession);
      const elapsed = Math.floor(
        (Date.now() - sessionData.startTime) / 1000 / 60,
      ); // minutes
      sessionButton = `
        <div class="flex items-center gap-2">
          <span class="text-emerald-400 text-sm font-medium">${elapsed} min</span>
          <button onclick="commitSession('${project.id}')" 
                  class="btn-primary px-3 py-2 rounded-lg text-sm font-medium">
            Commit
          </button>
        </div>
      `;
    } else if (project.status === "active") {
      sessionButton = `
        <button onclick="startSession('${project.id}')" 
                class="btn-primary px-3 py-2 rounded-lg text-sm font-medium">
          Start Session
        </button>
      `;
    }

    projectEl.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold text-slate-100">${project.client}</h3>
                        ${getStatusBadge(project.status)}
                    </div>
                    <div class="flex flex-wrap gap-4 text-sm text-slate-400">
                        <span>Value: $${project.value.toFixed(2)}</span>
                        <span>Hours: ${project.hours}</span>
                        <span>Rate: $${(project.value / project.hours).toFixed(2)}/hr</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    ${sessionButton}
                    <button onclick="toggleProjectStatus('${project.id}', '${project.status}')" 
                            class="btn-secondary px-3 py-2 rounded-lg text-sm font-medium">
                        Toggle Status
                    </button>
                    <button onclick="generateInvoice('${project.id}')" 
                            class="btn-primary px-3 py-2 rounded-lg text-sm font-medium">
                        Invoice
                    </button>
                    <button onclick="deleteProject('${project.id}')" 
                            class="btn-danger px-3 py-2 rounded-lg text-sm font-medium">
                        Delete
                    </button>
                </div>
            </div>
        `;

    container.appendChild(projectEl);
  });
}

// Client Functions
function initializeClientsListener() {
  clientsListener = db
    .collection("users")
    .doc(currentUserId)
    .collection("clients")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        clientsData = [];
        snapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...doc.data() });
        });
        renderClients();
        updateFinancialsView();
      },
      (error) => {
        console.error("Error listening to clients:", error);
      },
    );
}

function openClientModal() {
  document.getElementById("client-modal").classList.remove("hidden");
  document.getElementById("client-modal").classList.add("flex");
}

function closeClientModal() {
  document.getElementById("client-modal").classList.add("hidden");
  document.getElementById("client-modal").classList.remove("flex");
  document.getElementById("client-name").value = "";
  document.getElementById("client-email").value = "";
  document.getElementById("client-phone").value = "";
  document.getElementById("client-notes").value = "";
}

function addClient() {
  const name = document.getElementById("client-name").value.trim();
  const email = document.getElementById("client-email").value.trim();
  const phone = document.getElementById("client-phone").value.trim();
  const notes = document.getElementById("client-notes").value.trim();

  if (!name) {
    showToast("Please enter client name", "error");
    return;
  }

  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
    .add({
      name: name,
      email: email,
      phone: phone,
      notes: notes,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      closeClientModal();
      showToast("Client added successfully!", "success");
    })
    .catch((error) => {
      showToast("Error adding client", "error");
    });
}

function deleteClient(clientId) {
  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
    .doc(clientId)
    .delete()
    .then(() => {
      showToast("Client deleted", "success");
    })
    .catch((error) => {
      showToast("Error deleting client", "error");
    });
}

function renderClients() {
  const container = document.getElementById("clients-list");

  if (clientsData.length === 0) {
    container.innerHTML =
      '<p class="text-slate-500 text-center py-8">No items yet. Click the (+) button to add your first one!</p>';
    return;
  }

  container.innerHTML = "";

  clientsData.forEach((client, index) => {
    // Get client's projects
    const clientProjects = projectsData.filter(
      (p) => p.client.toLowerCase() === client.name.toLowerCase(),
    );
    const totalValue = clientProjects.reduce((sum, p) => sum + p.value, 0);

    const clientEl = document.createElement("div");
    clientEl.className = "p-4 bg-slate-800/50 rounded-lg animate-slide-in";
    clientEl.style.animationDelay = `${index * 0.05}s`;

    let projectsHtml = "";
    if (clientProjects.length > 0) {
      projectsHtml = `<div class="mt-4 pt-4 border-t border-slate-700">
        <p class="text-slate-400 text-sm mb-2 font-medium">Active Contracts:</p>
        <div class="space-y-2">`;
      clientProjects.forEach((project) => {
        projectsHtml += `
          <div class="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
            <div class="flex-1">
              <span class="text-slate-300 text-sm">${project.hours} hrs</span>
              <span class="text-slate-400 text-sm ml-2">$${project.value.toFixed(2)}</span>
            </div>
            <button onclick="exportPDF('${project.id}')" 
                    class="btn-primary px-2 py-1 rounded text-xs font-medium">
              Export PDF
            </button>
          </div>`;
      });
      projectsHtml += `</div></div>`;
    }

    clientEl.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold text-slate-100">${client.name}</h3>
                        ${client.email ? `<span class="text-slate-400 text-sm">${client.email}</span>` : ""}
                    </div>
                    <div class="flex flex-wrap gap-4 text-sm text-slate-400 mb-2">
                        ${client.phone ? `<span>📞 ${client.phone}</span>` : ""}
                        <span>📊 ${clientProjects.length} Projects</span>
                        <span>💰 $${totalValue.toFixed(2)} Total</span>
                    </div>
                    ${client.notes ? `<p class="text-slate-500 text-sm italic">${client.notes}</p>` : ""}
                    ${projectsHtml}
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="deleteClient('${client.id}')" 
                            class="btn-danger px-3 py-2 rounded-lg text-sm font-medium">
                        Delete
                    </button>
                </div>
            </div>
        `;

    container.appendChild(clientEl);
  });
}

// PDF Export Function
function exportPDF(projectId) {
  const project = projectsData.find((p) => p.id === projectId);
  if (!project) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Brand colors
  const primaryColor = [99, 102, 241]; // Indigo
  const secondaryColor = [30, 41, 59]; // Slate

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 105, 25, { align: "center" });

  // Invoice details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.text(`Date: ${invoiceDate}`, 20, 60);
  doc.text(`Invoice #: INV-${Date.now().toString().slice(-6)}`, 20, 70);
  doc.text(`Client: ${project.client}`, 20, 80);

  // Project details box
  doc.setFillColor(...secondaryColor);
  doc.rect(20, 95, 170, 50, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Project Details", 30, 110);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Estimated Hours: ${project.hours}`, 30, 125);
  doc.text(`Project Value: $${project.value.toFixed(2)}`, 30, 135);
  doc.text(
    `Hourly Rate: $${(project.value / project.hours).toFixed(2)}/hr`,
    30,
    145,
  );

  // Total
  doc.setFillColor(...primaryColor);
  doc.rect(20, 155, 170, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL DUE", 30, 172);
  doc.text(`$${project.value.toFixed(2)}`, 180, 172, { align: "right" });

  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", 105, 200, { align: "center" });
  doc.text("Payment due upon receipt.", 105, 210, { align: "center" });

  // Save PDF
  doc.save(`Invoice_${project.client}_${Date.now()}.pdf`);
  showToast("PDF exported successfully!", "success");
}

// Time Tracking Functions
function startSession(projectId) {
  const sessionData = {
    startTime: Date.now(),
    projectId: projectId,
  };
  localStorage.setItem(
    `activeSession_${projectId}`,
    JSON.stringify(sessionData),
  );
  renderProjects();
  showToast("Session started!", "success");

  // Start timer to update display
  updateSessionTimer(projectId);
}

function commitSession(projectId) {
  const activeSession = localStorage.getItem(`activeSession_${projectId}`);
  if (!activeSession) return;

  const sessionData = JSON.parse(activeSession);
  const elapsedMinutes = (Date.now() - sessionData.startTime) / 1000 / 60;
  const elapsedHours = elapsedMinutes / 60;

  // Update project hours in Firestore
  const project = projectsData.find((p) => p.id === projectId);
  if (project) {
    const newHours = project.hours + elapsedHours;
    const newValue =
      project.value + elapsedHours * (project.value / project.hours);

    db.collection("users")
      .doc(currentUserId)
      .collection("projects")
      .doc(projectId)
      .update({
        hours: newHours,
        value: newValue,
      })
      .then(() => {
        localStorage.removeItem(`activeSession_${projectId}`);
        renderProjects();
        showToast(
          `Committed ${elapsedHours.toFixed(2)} hours to project!`,
          "success",
        );
      })
      .catch((error) => {
        showToast("Error committing session", "error");
      });
  }
}

function updateSessionTimer(projectId) {
  const activeSession = localStorage.getItem(`activeSession_${projectId}`);
  if (!activeSession) return;

  const interval = setInterval(() => {
    const currentSession = localStorage.getItem(`activeSession_${projectId}`);
    if (!currentSession) {
      clearInterval(interval);
      return;
    }

    renderProjects();
  }, 60000); // Update every minute
}

// Financial Summary Functions
function updateFinancialSummary() {
  // Calculate Monthly Income (sum of completed project payments)
  const completedProjects = projectsData.filter(
    (p) => p.status === "completed",
  );
  const monthlyIncome = completedProjects.reduce((sum, p) => sum + p.value, 0);

  // Calculate Monthly Expenses (sum of all expenses)
  const monthlyExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);

  // Calculate Net Profit
  const netProfit = monthlyIncome - monthlyExpenses;

  // Update summary cards
  document.getElementById("monthly-income").textContent =
    `$${monthlyIncome.toFixed(2)}`;
  document.getElementById("monthly-expenses").textContent =
    `$${monthlyExpenses.toFixed(2)}`;
  document.getElementById("net-profit").textContent =
    `$${netProfit.toFixed(2)}`;

  // Update existing financial chart with pipeline value for detailed view
  const pipelineValue = projectsData.reduce((sum, p) => sum + p.value, 0);
  updateFinancialChart(pipelineValue, monthlyExpenses, netProfit);
  updateDetailedFinancialChart();
}

function initializeFinancialChart() {
  const ctx = document.getElementById("financial-chart").getContext("2d");

  financialChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Revenue", "Expenses", "Net Profit"],
      datasets: [
        {
          label: "Financial Overview",
          data: [0, 0, 0],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(99, 102, 241, 0.8)",
          ],
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(99, 102, 241, 1)",
          ],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          titleColor: "#e2e8f0",
          bodyColor: "#e2e8f0",
          borderColor: "rgba(99, 102, 241, 0.3)",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return "$" + context.raw.toFixed(2);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(148, 163, 184, 0.1)",
          },
          ticks: {
            color: "#94a3b8",
            callback: function (value) {
              return "$" + value;
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#94a3b8",
          },
        },
      },
    },
  });
}

function initializeDetailedFinancialChart() {
  const ctx = document
    .getElementById("financial-chart-detailed")
    .getContext("2d");

  detailedFinancialChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Revenue", "Expenses", "Net Profit"],
      datasets: [
        {
          label: "Financial Overview",
          data: [0, 0, 0],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(99, 102, 241, 0.8)",
          ],
          borderColor: [
            "rgba(16, 185, 129, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(99, 102, 241, 1)",
          ],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          titleColor: "#e2e8f0",
          bodyColor: "#e2e8f0",
          borderColor: "rgba(99, 102, 241, 0.3)",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return "$" + context.raw.toFixed(2);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(148, 163, 184, 0.1)",
          },
          ticks: {
            color: "#94a3b8",
            callback: function (value) {
              return "$" + value;
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#94a3b8",
          },
        },
      },
    },
  });
}

function updateFinancialChart(revenue, expenses, profit) {
  if (financialChart) {
    financialChart.data.datasets[0].data = [revenue, expenses, profit];
    financialChart.update("active");
  }
}

function updateDetailedFinancialChart() {
  const pipelineValue = projectsData.reduce((sum, p) => sum + p.value, 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = pipelineValue - totalExpenses;

  if (detailedFinancialChart) {
    detailedFinancialChart.data.datasets[0].data = [
      pipelineValue,
      totalExpenses,
      netProfit,
    ];
    detailedFinancialChart.update("active");
  }
}

function updateFinancialsView() {
  // Update expense breakdown
  const expensesBreakdown = document.getElementById("expenses-breakdown");
  if (expensesData.length === 0) {
    expensesBreakdown.innerHTML =
      '<p class="text-slate-500 text-center py-4">No expense data</p>';
  } else {
    expensesBreakdown.innerHTML = "";
    expensesData.forEach((expense) => {
      const expenseEl = document.createElement("div");
      expenseEl.className =
        "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg";
      expenseEl.innerHTML = `
                <span class="text-slate-100">${expense.name}</span>
                <span class="text-emerald-400 font-medium">$${expense.amount.toFixed(
                  2,
                )}</span>
            `;
      expensesBreakdown.appendChild(expenseEl);
    });
  }

  // Update revenue by client
  const revenueByClient = document.getElementById("revenue-by-client");
  if (projectsData.length === 0) {
    revenueByClient.innerHTML =
      '<p class="text-slate-500 text-center py-4">No revenue data</p>';
  } else {
    // Group projects by client
    const clientRevenue = {};
    projectsData.forEach((project) => {
      const client = project.client;
      if (!clientRevenue[client]) {
        clientRevenue[client] = 0;
      }
      clientRevenue[client] += project.value;
    });

    revenueByClient.innerHTML = "";
    Object.entries(clientRevenue).forEach(([client, revenue]) => {
      const clientEl = document.createElement("div");
      clientEl.className =
        "flex items-center justify-between p-3 bg-slate-800/50 rounded-lg";
      clientEl.innerHTML = `
                <span class="text-slate-100">${client}</span>
                <span class="text-emerald-400 font-medium">$${revenue.toFixed(
                  2,
                )}</span>
            `;
      revenueByClient.appendChild(clientEl);
    });
  }

  // Update intelligence modules
  updateCapacityPlanning();
  updateTaxEstimation();
}

function updateCapacityPlanning() {
  // Calculate total estimated hours for active projects
  const activeProjects = projectsData.filter((p) => p.status === "active");
  const totalHours = activeProjects.reduce((sum, p) => sum + p.hours, 0);

  const capacityHoursEl = document.getElementById("capacity-hours");
  const capacityStatusEl = document.getElementById("capacity-status");

  capacityHoursEl.textContent = `${totalHours.toFixed(1)} hrs`;

  if (totalHours > 40) {
    capacityHoursEl.classList.remove("text-slate-100");
    capacityHoursEl.classList.add("text-red-400");
    capacityStatusEl.textContent = "Over Capacity";
    capacityStatusEl.classList.remove("bg-emerald-500/20", "text-emerald-400");
    capacityStatusEl.classList.add("bg-red-500/20", "text-red-400");
  } else {
    capacityHoursEl.classList.remove("text-red-400");
    capacityHoursEl.classList.add("text-slate-100");
    capacityStatusEl.textContent = "Within Capacity";
    capacityStatusEl.classList.remove("bg-red-500/20", "text-red-400");
    capacityStatusEl.classList.add("bg-emerald-500/20", "text-emerald-400");
  }
}

function updateTaxEstimation() {
  // Calculate net profit (revenue - expenses)
  const pipelineValue = projectsData.reduce((sum, p) => sum + p.value, 0);
  const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = pipelineValue - totalExpenses;

  // Calculate 25% tax reserve
  const taxReserve = netProfit * 0.25;

  const taxNetProfitEl = document.getElementById("tax-net-profit");
  const taxReserveEl = document.getElementById("tax-reserve");

  taxNetProfitEl.textContent = `$${netProfit.toFixed(2)}`;
  taxReserveEl.textContent = `$${taxReserve.toFixed(2)}`;
}

// Rate Calculator Functions
function calculateRate() {
  const monthlyExpenses =
    parseFloat(document.getElementById("monthly-expenses").value) || 0;
  const targetIncome =
    parseFloat(document.getElementById("target-income").value) || 0;
  const billableHours =
    parseFloat(document.getElementById("billable-hours").value) || 0;

  let recommendedRate = 0;

  if (billableHours > 0) {
    recommendedRate = (monthlyExpenses + targetIncome) / billableHours;
  }

  document.getElementById("recommended-rate").textContent =
    `$${recommendedRate.toFixed(2)}`;
}

// Initialize rate calculator with current expenses
function syncExpensesToRateCalculator() {
  const totalMonthlyExpenses = expensesData.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  document.getElementById("monthly-expenses").value = totalMonthlyExpenses;
  calculateRate();
}

// Call sync when expenses change
const originalRenderExpenses = renderExpenses;
renderExpenses = function () {
  originalRenderExpenses();
  syncExpensesToRateCalculator();
};

// Close modal on outside click
document
  .getElementById("project-modal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeProjectModal();
    }
  });

document.getElementById("client-modal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeClientModal();
  }
});

// Handle keyboard events
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeProjectModal();
    closeClientModal();
  }

  if (e.key === "Enter") {
    const activeElement = document.activeElement;
    if (
      activeElement.id === "expense-name" ||
      activeElement.id === "expense-amount"
    ) {
      addExpense();
    }
  }
});

// Initialize on load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Freelance Command Center loaded");
});
