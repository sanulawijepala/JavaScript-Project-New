import { transactions } from "../script.js";

// Main report generator function
export function generateReport() {
  let doc;

  try {
    const { jsPDF } = window.jspdf;
    doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  } catch (error) {
    console.error(
      "Error initializing jsPDF. Make sure jsPDF is included using https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    );
    return;
  }

  // Theme colors
  const primaryColor = [41, 128, 185]; // Blue
  const secondaryColor = [44, 62, 80]; // Slate
  const accentColor = [46, 204, 113]; // Green
  const negativeColor = [231, 76, 60]; // Red

  // Metadata
  doc.setProperties({
    title: "Budget Report",
    subject: "Financial Summary",
    author: "SpendWise",
    creator: "SpendWise",
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Report title
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("BUDGET REPORT", margin, 25);

  // Date
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${dateStr}`, pageWidth - margin - 60, 25);

  // Reset text color
  doc.setTextColor(...secondaryColor);

  // Summary data
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome + totalExpense;

  // Summary heading
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", margin, 55);

  // Summary boxes
  const summaryStartY = 65;
  const boxWidth = (pageWidth - 2 * margin) / 3;
  const boxHeight = 40;

  const drawSummaryBox = (label, value, x, color) => {
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(x, summaryStartY, boxWidth - 5, boxHeight, 3, 3, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...secondaryColor);
    doc.text(label, x + 10, summaryStartY + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...color);
    doc.text(`$${value.toFixed(2)}`, x + 10, summaryStartY + 30);
  };

  drawSummaryBox("TOTAL INCOME", totalIncome, margin, accentColor);
  drawSummaryBox("TOTAL EXPENSES", Math.abs(totalExpense), margin + boxWidth, negativeColor);
  drawSummaryBox("NET BALANCE", balance, margin + boxWidth * 2, balance >= 0 ? accentColor : negativeColor);

  // Category Breakdown
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...secondaryColor);
  doc.text("Expense Breakdown by Category", margin, summaryStartY + boxHeight + 20);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, summaryStartY + boxHeight + 25, pageWidth - margin, summaryStartY + boxHeight + 25);

  // Prepare category data
  const categorySummary = {};
  let totalCategorized = 0;

  transactions.forEach((t) => {
    if (t.amount < 0) {
      const cat = t.category || "Uncategorized";
      categorySummary[cat] = (categorySummary[cat] || 0) + Math.abs(t.amount);
      totalCategorized += Math.abs(t.amount);
    }
  });

  const sortedCategories = Object.keys(categorySummary).sort(
    (a, b) => categorySummary[b] - categorySummary[a]
  );

  // Render category bars
  let yPos = summaryStartY + boxHeight + 35;
  doc.setFontSize(11);

  sortedCategories.forEach((category, index) => {
    const amount = categorySummary[category];
    const percentage = Math.round((amount / totalCategorized) * 100);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text(`${category}`, margin, yPos);

    doc.setFont("helvetica", "normal");
    doc.text(`$${amount.toFixed(2)} (${percentage}%)`, pageWidth - margin - 30, yPos, { align: "right" });

    // Bar background
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(margin, yPos + 5, pageWidth - 2 * margin, 5, 2, 2, "F");

    // Bar fill
    const fillWidth = (pageWidth - 2 * margin) * (percentage / 100);
    doc.setFillColor(...primaryColor);
    doc.roundedRect(margin, yPos + 5, fillWidth, 5, 2, 2, "F");

    yPos += 20;

    // Add new page if needed
    if (yPos > pageHeight - 30 && index < sortedCategories.length - 1) {
      doc.addPage();
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 15, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Budget Report - Continued", margin, 10);
      yPos = 30;
    }
  });

  // Recent Transactions
  if (yPos < pageHeight - 70) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text("Recent Transactions", margin, yPos + 10);

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos + 15, pageWidth - margin, yPos + 15);

    // Headers
    yPos += 25;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Date", margin, yPos);
    doc.text("Description", margin + 30, yPos);
    doc.text("Category", margin + 100, yPos);
    doc.text("Amount", pageWidth - margin - 15, yPos, { align: "right" });

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    doc.setFont("helvetica", "normal");

    recentTransactions.forEach((tx) => {
      yPos += 10;

      const txDate = new Date(tx.date);
      const dateFormatted = txDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      doc.text(dateFormatted, margin, yPos);

      let desc = tx.description.length > 25 ? tx.description.slice(0, 22) + "..." : tx.description;
      doc.text(desc, margin + 30, yPos);

      doc.text(tx.category, margin + 100, yPos);

      const isExpense = tx.amount < 0;
      doc.setTextColor(...(isExpense ? negativeColor : accentColor));
      doc.text(`${isExpense ? "-" : "+"}$${Math.abs(tx.amount).toFixed(2)}`, pageWidth - margin - 15, yPos, {
        align: "right",
      });

      doc.setTextColor(...secondaryColor);
    });
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Generated by SpendWise", pageWidth / 2, pageHeight - 10, {
    align: "center",
  });

  // Save file
  doc.save("Budget_Report.pdf");
}

// Modular event listener (called in script.js)
export function generateReportButtonHandler() {
  const btn = document.getElementById("generate-report-btn");
  if (btn) {
    btn.addEventListener("click", generateReport);
  } else {
    console.warn("Generate Report button not found.");
  }
}
export function generateReport() {
  console.log("generateReport() called"); // ADD THIS

}

export function generateReportButtonHandler() {
  console.log("Trying to attach event to button"); // ADD THIS
  const btn = document.getElementById("generate-report-btn");
  if (btn) {
    console.log("Button found! Adding click listener."); // ADD THIS
    btn.addEventListener("click", generateReport);
  } else {
    console.warn("Generate Report button not found.");
  }
}
// generateReport.js
import jsPDF from "jspdf";
import "jspdf-autotable";

export function generateBudgetReport() {
  const doc = new jsPDF();

  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  const goals = JSON.parse(localStorage.getItem("goals")) || [];

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income + expense;

  doc.setFontSize(18);
  doc.text("SpendWise Budget Report", 14, 20);

  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

  doc.text(`Total Income: Rs. ${income.toFixed(2)}`, 14, 40);
  doc.text(`Total Expenses: Rs. ${Math.abs(expense).toFixed(2)}`, 14, 48);
  doc.text(`Balance: Rs. ${balance.toFixed(2)}`, 14, 56);

  // Transactions Table
  if (transactions.length > 0) {
    doc.autoTable({
      startY: 65,
      head: [["Date", "Description", "Amount", "Category"]],
      body: transactions.slice(-10).map((t) => [
        t.date,
        t.description,
        `Rs. ${t.amount.toFixed(2)}`,
        t.category || "-",
      ]),
      theme: "striped",
    });
  } else {
    doc.text("No transactions available.", 14, 70);
  }

  // Savings Goals Summary
  let yOffset = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 75;
  doc.setFontSize(14);
  doc.text("Savings Goals Summary", 14, yOffset);

  if (goals.length > 0) {
    const goalData = goals.map((g) => {
      const progress = ((g.currentAmount / g.targetAmount) * 100).toFixed(1);
      const remaining = g.targetAmount - g.currentAmount;
      return [
        g.name,
        `Rs. ${g.currentAmount.toFixed(2)} / Rs. ${g.targetAmount.toFixed(2)}`,
        `${progress}%`,
        `Rs. ${remaining.toFixed(2)}`,
      ];
    });

    doc.autoTable({
      startY: yOffset + 6,
      head: [["Goal Name", "Progress", "Completion %", "Remaining"]],
      body: goalData,
      theme: "grid",
    });
  } else {
    doc.setFontSize(12);
    doc.text("No savings goals available.", 14, yOffset + 8);
  }

  doc.save("SpendWise_Budget_Report.pdf");}
