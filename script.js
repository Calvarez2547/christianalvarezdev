const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-links a");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

function closeMobileMenu() {
  navMenu.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMobileMenu();
  });
});

// Highlight the navigation item for the section currently in view.
const sections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0,
  }
);

sections.forEach((section) => sectionObserver.observe(section));

function showError(field, message) {
  const row = field.closest(".form-row");
  const error = row.querySelector(".error-message");

  row.classList.add("error");
  error.textContent = message;
}

function clearError(field) {
  const row = field.closest(".form-row");
  const error = row.querySelector(".error-message");

  row.classList.remove("error");
  error.textContent = "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = contactForm.elements.name;
  const email = contactForm.elements.email;
  const message = contactForm.elements.message;
  let isValid = true;

  [name, email, message].forEach(clearError);
  formStatus.textContent = "";

  if (!name.value.trim()) {
    showError(name, "Please enter your name.");
    isValid = false;
  }

  if (!email.value.trim()) {
    showError(email, "Please enter your email.");
    isValid = false;
  } else if (!isValidEmail(email.value.trim())) {
    showError(email, "Please enter a valid email address.");
    isValid = false;
  }

  if (!message.value.trim()) {
    showError(message, "Please enter a message.");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  formStatus.textContent = "Thank you. Your message is ready to be connected to Supabase.";
  contactForm.reset();
});

contactForm.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => {
    clearError(field);
    formStatus.textContent = "";
  });
});
