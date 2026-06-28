const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-links a");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const darkToggle = document.getElementById("dark-toggle");

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  darkToggle.textContent = dark ? "☀" : "☾";
  darkToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
let isDark = savedTheme ? savedTheme === "dark" : prefersDark;
applyTheme(isDark);

darkToggle.addEventListener("click", () => {
  isDark = !isDark;
  localStorage.setItem("theme", isDark ? "dark" : "light");
  applyTheme(isDark);
});

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

if (contactForm) contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = contactForm.elements.name;
  const email = contactForm.elements.email;
  const company = contactForm.elements.company;
  const message = contactForm.elements.message;
  const submitButton = contactForm.querySelector("button[type='submit']");
  let isValid = true;

  [name, email, message].forEach(clearError);
  formStatus.textContent = "";
  formStatus.classList.remove("error");

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

  const formData = {
    name: name.value.trim(),
    email: email.value.trim(),
    company: company.value.trim(),
    message: message.value.trim(),
  };

  // Opening index.html locally cannot run Cloudflare Pages Functions.
  if (window.location.protocol === "file:") {
    formStatus.textContent = "Thank you. Your message is ready to be connected to Supabase.";
    contactForm.reset();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Message could not be sent.");
    }

    formStatus.textContent = "Thank you. Your message has been sent.";
    contactForm.reset();
  } catch (error) {
    formStatus.classList.add("error");
    formStatus.textContent = error.message || "Something went wrong. Please email me directly.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
});

if (contactForm) contactForm.querySelectorAll("input, textarea").forEach((field) => {
  field.addEventListener("input", () => {
    clearError(field);
    formStatus.textContent = "";
    formStatus.classList.remove("error");
  });
});
