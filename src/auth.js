// src/auth.js
/* ══════════════════════════════════════════════════════════
   InvoiceForge — Authentication Logic
   ══════════════════════════════════════════════════════════ */

// supabaseClient is available globally from src/supabase.js

// UI Elements
const btnLoginNav = document.getElementById('btn-login');
const btnLogoutNav = document.getElementById('btn-logout');
const userProfile = document.getElementById('user-profile');
const userEmailDisplay = document.getElementById('user-email');
const authModal = document.getElementById('auth-modal');
const authClose = document.getElementById('auth-close');
const authForm = document.getElementById('auth-form');
const authEmailInput = document.getElementById('auth-email');
const authPassInput = document.getElementById('auth-password');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const btnAuthToggle = document.getElementById('btn-auth-toggle'); // Note: Initially null until injected
const btnGoogleAuth = document.getElementById('btn-google-auth');
const authTitle = document.getElementById('auth-title');
const authSubDesc = document.getElementById('auth-sub-desc');
const authFooter = document.getElementById('auth-footer');
const authError = document.getElementById('auth-error');

let isSignUpMode = false;

// Check current session on load
checkSession();

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
  updateUI(session?.user);
});

async function checkSession() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (session) {
    updateUI(session.user);
  } else {
    updateUI(null);
  }
}

function updateUI(user) {
  if (user) {
    if (btnLoginNav) btnLoginNav.style.display = 'none';
    if (userProfile) {
      userProfile.classList.remove('hidden');
      userProfile.style.display = 'flex';
    }
    if (userEmailDisplay) userEmailDisplay.textContent = user.email;
    closeModal();
  } else {
    if (btnLoginNav) btnLoginNav.style.display = 'flex';
    if (userProfile) {
      userProfile.classList.add('hidden');
      userProfile.style.display = 'none';
    }
    if (userEmailDisplay) userEmailDisplay.textContent = '';
  }
}

// Modal logic
function openModal() {
  if (authModal) {
    authModal.classList.add('visible');
    if (authError) authError.textContent = '';
    if (authForm) authForm.reset();
  }
}

function closeModal() {
  if (authModal) authModal.classList.remove('visible');
}

if (btnLoginNav) {
  btnLoginNav.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = false;
    updateModalMode();
    openModal();
  });
}

if (authClose) {
  authClose.addEventListener('click', closeModal);
}

if (authModal) {
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeModal();
  });
}

if (btnAuthToggle) {
  btnAuthToggle.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    updateModalMode();
  });
}

function updateModalMode() {
  if (authError) authError.textContent = '';
  if (isSignUpMode) {
    if (authTitle) authTitle.textContent = 'Create an Account';
    if (btnAuthSubmit) btnAuthSubmit.innerHTML = 'Sign Up';
    if (authSubDesc) authSubDesc.textContent = 'Sign up to start creating invoices';
    if (authFooter) authFooter.innerHTML = "Already have an account? <span class=\"auth-toggle-link\" id=\"btn-auth-toggle\">Sign In</span>";
  } else {
    if (authTitle) authTitle.textContent = 'Welcome Back';
    if (btnAuthSubmit) btnAuthSubmit.innerHTML = 'Sign In';
    if (authSubDesc) authSubDesc.textContent = 'Sign in to access your invoices';
    if (authFooter) authFooter.innerHTML = "Don't have an account? <span class=\"auth-toggle-link\" id=\"btn-auth-toggle\">Sign Up</span>";
  }
  
  // Re-attach listener to the newly injected toggle span
  const newToggle = document.getElementById('btn-auth-toggle');
  if (newToggle) {
    newToggle.addEventListener('click', () => {
      isSignUpMode = !isSignUpMode;
      updateModalMode();
    });
  }
}

// Form submission (Email/Password)
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmailInput.value;
    const password = authPassInput.value;

    authError.textContent = '';
    btnAuthSubmit.disabled = true;

    if (isSignUpMode) {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        authError.textContent = error.message;
      } else {
        // usually successful signup requires email confirmation, so inform user
        if (data?.user?.identities?.length === 0) {
           authError.textContent = 'Account exists or error occurred.';
        } else {
           alert("Signup complete. Check your email or try logging in.");
           closeModal();
        }
      }
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        authError.textContent = error.message;
      } else {
        closeModal();
      }
    }
    btnAuthSubmit.disabled = false;
  });
}

// Logout
if (btnLogoutNav) {
  btnLogoutNav.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) console.error('Error signing out:', error.message);
  });
}

// Google Auth
if (btnGoogleAuth) {
  btnGoogleAuth.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      if (authError) authError.textContent = error.message;
    }
  });
}
