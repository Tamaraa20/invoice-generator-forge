// Auth Module
const { createClient } = supabase;

const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const authModal = document.getElementById('auth-modal');
const authClose = document.getElementById('auth-close');
const btnGoogleAuth = document.getElementById('btn-google-auth');
const authForm = document.getElementById('auth-form');
const btnAuthToggle = document.getElementById('btn-auth-toggle');
const authTitle = document.getElementById('auth-title');
const authSubDesc = document.getElementById('auth-sub-desc');
const btnAuthSubmit = document.getElementById('btn-auth-submit');
const authError = document.getElementById('auth-error');
const userProfile = document.getElementById('user-profile');
const userEmailDisplay = document.getElementById('user-email');

let isSignUp = false;

function initAuth() {
  const supabaseClient = window.supabaseClient;

  // Toggle Modal
  btnLogin.onclick = () => {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  authClose.onclick = () => {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Switch between Login / Signup
  btnAuthToggle.onclick = () => {
    isSignUp = !isSignUp;
    authTitle.textContent = isSignUp ? "Create Account" : "Welcome Back";
    authSubDesc.textContent = isSignUp ? "Start generating professional invoices" : "Sign in to access your invoices";
    btnAuthSubmit.textContent = isSignUp ? "Sign Up" : "Sign In";
    btnAuthToggle.textContent = isSignUp ? "Sign In" : "Sign Up";
    authForm.parentElement.querySelector('.auth-footer').childNodes[0].textContent = isSignUp ? "Already have an account? " : "Don't have an account? ";
  };

  // Google Auth
  btnGoogleAuth.onclick = async () => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) showError(error.message);
  };

  // Form Submit
  authForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    setLoading(true);
    authError.style.display = 'none';

    try {
      if (isSignUp) {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        alert("Verification email sent! Please check your inbox.");
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      authModal.classList.remove('active');
      document.body.style.overflow = '';
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    updateUI(session?.user);
  });
}

function updateUI(user) {
  if (user) {
    btnLogin.classList.add('hidden');
    userProfile.classList.remove('hidden');
    userEmailDisplay.textContent = user.email;
  } else {
    btnLogin.classList.remove('hidden');
    userProfile.classList.add('hidden');
  }
}

function showError(msg) {
  authError.textContent = msg;
  authError.style.display = 'block';
}

function setLoading(loading) {
  btnAuthSubmit.disabled = loading;
  btnAuthSubmit.textContent = loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In");
}

btnLogout.onclick = async () => {
    await window.supabaseClient.auth.signOut();
};

window.addEventListener('DOMContentLoaded', initAuth);
