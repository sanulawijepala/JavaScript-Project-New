// Savings Goals Functionality
let goals = JSON.parse(localStorage.getItem("goals")) || [];

// Add new goal with better validation
function addNewGoal() {
  const name = document.getElementById("goal-name").value.trim();
  const targetAmount = parseFloat(document.getElementById("goal-amount").value);
  const targetDate = document.getElementById("goal-date").value;
  const initialAmount = parseFloat(document.getElementById("initial-amount").value) || 0;

  // Validate inputs
  if (!name || name.length < 3) {
    showAlert("Please enter a valid goal name (at least 3 characters)");
    return;
  }

  if (isNaN(targetAmount) || targetAmount <= 0) {
    showAlert("Please enter a valid target amount (greater than 0)");
    return;
  }

  if (!targetDate || new Date(targetDate) < new Date()) {
    showAlert("Please select a valid future date");
    return;
  }

  if (isNaN(initialAmount) || initialAmount < 0) {
    showAlert("Initial amount must be 0 or positive");
    return;
  }

  const newGoal = {
    id: Date.now(),
    name,
    targetAmount,
    targetDate,
    currentAmount: initialAmount,
    createdAt: new Date().toISOString(),
  };

  goals.push(newGoal);
  updateGoalsInLocalStorage();
  updateGoalsList();
  showAlert("Goal added successfully!", "success");

  // Clear form
  document.getElementById("goal-name").value = "";
  document.getElementById("goal-amount").value = "";
  document.getElementById("goal-date").value = "";
  document.getElementById("initial-amount").value = "0";
}

// Improved goal contribution with transaction integration
function contributeToGoal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;

  // Create modal instead of using prompt
  const amount = parseFloat(prompt("Enter contribution amount:"));
  
  if (isNaN(amount) || amount <= 0) {
    showAlert("Please enter a valid positive amount");
    return;
  }

  // Check if enough balance exists
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  const balance = transactions.reduce((acc, t) => acc + t.amount, 0);
  
  if (amount > balance) {
    showAlert(`Insufficient funds. Your current balance is Rs. ${balance.toFixed(2)}`);
    return;
  }

  // Add transaction
  const newTransaction = {
    id: Date.now(),
    description: `Contribution to ${goal.name}`,
    amount: -amount, // Negative because it's an expense
    category: "Savings",
    date: new Date().toISOString().split('T')[0],
  };

  transactions.push(newTransaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));

  // Update goal
  goal.currentAmount += amount;
  updateGoalsInLocalStorage();
  updateGoalsList();
  
  // Update UI
  updateValues(
    document.getElementById("balance"),
    document.getElementById("income"),
    document.getElementById("expense")
  );
  
  showAlert(`Successfully contributed Rs. ${amount.toFixed(2)} to ${goal.name}`, "success");
}

// Improved edit functionality
function editGoal(id) {
  const goal = goals.find((g) => g.id === id);
  if (!goal) return;

  // In a real app, replace with modal
  const newName = prompt("Edit goal name:", goal.name);
  if (newName !== null && newName.trim() !== "") {
    goal.name = newName.trim();
  }

  const newTarget = prompt("Edit target amount:", goal.targetAmount);
  if (newTarget !== null && !isNaN(newTarget)) {
    goal.targetAmount = parseFloat(newTarget);
  }

  const newDate = prompt("Edit target date (YYYY-MM-DD):", goal.targetDate);
  if (newDate !== null && new Date(newDate) > new Date()) {
    goal.targetDate = newDate;
  }

  updateGoalsInLocalStorage();
  updateGoalsList();
}

// Improved progress calculation
function calculateGoalProgress(goal) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const targetDate = new Date(goal.targetDate);
  const daysLeft = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));

  return {
    progress: Math.min(100, progress), // Cap at 100%
    remaining: Math.max(0, remaining), // Don't show negative
    daysLeft: daysLeft > 0 ? daysLeft : 0, // Minimum 0
    dailyNeeded: daysLeft > 0 ? remaining / daysLeft : 0,
    isCompleted: goal.currentAmount >= goal.targetAmount,
    isOverdue: daysLeft < 0 && !(goal.currentAmount >= goal.targetAmount)
  };
}

// Helper function to show alerts
function showAlert(message, type = "error") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert ${type}`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  updateGoalsList();
  
  const addGoalBtn = document.getElementById("add-goal-btn");
  if (addGoalBtn) {
    addGoalBtn.addEventListener("click", addNewGoal);
  }
});