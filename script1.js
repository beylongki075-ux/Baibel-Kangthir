 // Get all pages
const pages = document.querySelectorAll(".page");
let currentPage = 0;

// Number of visible page numbers in pagination
const visiblePages = 3;
const totalPages = pages.length;

// Create pagination container
const pagination = document.createElement("div");
pagination.id = "pagination";
document.body.appendChild(pagination);

function showPage(pageIndex) {
  // Hide all pages
  pages.forEach((page, i) => {
    page.classList.toggle("active", i === pageIndex);
    page.style.display = i === pageIndex ? "block" : "none";
  });

  // Update buttons
  document.getElementById("backBtn").disabled = pageIndex === 0;
  document.getElementById("nextBtn").disabled = pageIndex === totalPages - 1;

  updatePagination(pageIndex);
}

function updatePagination(pageIndex) {
  pagination.innerHTML = "";

  // Determine which pages to show
  let start = Math.floor(pageIndex / visiblePages) * visiblePages;
  let end = Math.min(start + visiblePages, totalPages);

  // Left arrow
  const leftArrow = document.createElement("button");
  leftArrow.textContent = "<";
  leftArrow.disabled = start === 0;
  leftArrow.onclick = () => {
    if (start > 0) {
      showPage(start - 1);
    }
  };
  pagination.appendChild(leftArrow);

  // Page numbers
  for (let i = start; i < end; i++) {
    const btn = document.createElement("button");
    btn.textContent = i + 1;
    if (i === pageIndex) btn.classList.add("active-page");
    btn.onclick = () => showPage(i);
    pagination.appendChild(btn);
  }

  // Right arrow
  const rightArrow = document.createElement("button");
  rightArrow.textContent = ">";
  rightArrow.disabled = end >= totalPages;
  rightArrow.onclick = () => {
    if (end < totalPages) {
      showPage(end);
    }
  };
  pagination.appendChild(rightArrow);
}

// Next and Previous functions
function nextPage() {
  if (currentPage < totalPages - 1) {
    currentPage++;
    showPage(currentPage);
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    showPage(currentPage);
  }
}

// Initialize first page
showPage(currentPage);
 