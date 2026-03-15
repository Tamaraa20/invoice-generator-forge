// src/auth.js
const { createClient } = supabase;

/**
 * Main updateUI function that handles the gatekeeper logic
 */
function updateUI(user) {
  const loginBtn = document.getElementById('btn-login');
  const logoutBtn = document.getElementById('btn-logout');
  const userProfile = document.getElementById('user-profile');
  const userEmail = document.getElementById('user-email');
  const appContainer = document.getElementById('app');
  const newInvoiceBtn = document.getElementById('btn-new-invoice');

  if (user) {
    // ─── USER IS LOGGED IN ───
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (userProfile) {
      userProfile.classList.remove('hidden');
      userProfile.style.display = 'flex';
    }
    if (userEmail) userEmail.textContent = user.email;
    
    // Show the main application source
    if (appContainer) {
      appContainer.style.display = 'grid'; // Restore grid layout
    }
    
    // Show the "New" button in navbar
    if (newInvoiceBtn) {
      newInvoiceBtn.style.display = 'flex';
    }

    // Modal can be closed if user is logged in
    // But usually you'd want to close it automatically after success
  } else {
    // ─── NO USER LOGGED IN ───
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (userProfile) {
      userProfile.classList.add('hidden');
      userProfile.style.display = 'none';
    }
    
    // Hide the main application (Gatekeeper)
    if (appContainer) {
      appContainer.style.display = 'none';
    }
    
    // Hide the "New" button (Gatekeeper)
    if (newInvoiceBtn) {
      newInvoiceBtn.style.display = 'none';
    }

    // Since we want the login page to show up first,
    // we force open the modal if no session exists.
    openModal();
  }
}

// ─── Session Management ───
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
  updateUI(session?.user || null);
  
  if (event === 'SIGNED_IN') {
    closeModal();
  }
});

// Initial check
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  updateUI(session?.user || null);
});

// ─── Auth Actions ───
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authToggleLink = document.getElementById('btn-auth-toggle');
const authSubmitBtn = document.getElementById('btn-auth-submit');
const authError = document.getElementById('auth-error');
const authClose = document.getElementById('auth-close');
const googleAuthBtn = document.getElementById('btn-google-auth');

let isSignUp = false;

function openModal() {
  if (authModal) {
    authModal.classList.add('active');
    authError.textContent = '';
    authForm.reset();
  }
}

async function closeModal() {
  // Gatekeeper: only allow closing if user is authenticated
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && authModal) {
    authModal.classList.remove('active');
  } else {
    console.warn('Cannot close login modal without an active session.');
  }
}

function toggleAuthMode() {
  isSignUp = !isSignUp;
  authTitle.textContent = isSignUp ? 'Create Account' : 'Welcome Back';
  authSubmitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
  authToggleLink.textContent = isSignUp ? 'Sign In' : 'Sign Up';
  authError.textContent = '';
}

authForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  
  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = isSignUp ? 'Creating...' : 'Signing In...';
  authError.textContent = '';

  try {
    let result;
    if (isSignUp) {
      result = await supabaseClient.auth.signUp({ email, password });
    } else {
      result = await supabaseClient.auth.signInWithPassword({ email, password });
    }

    if (result.error) throw result.error;
    
    if (isSignUp && result.data?.user?.identities?.length === 0) {
      authError.textContent = "This email is already registered.";
    } else if (isSignUp) {
      authError.style.color = '#34d399';
      authError.textContent = "Success! Please check your email to confirm.";
    }

  } catch (error) {
    authError.style.color = '#f87171';
    authError.textContent = error.message;
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
  }
});

googleAuthBtn?.addEventListener('click', async () => {
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (error) {
    authError.textContent = error.message;
  }
});

document.getElementById('btn-login')?.addEventListener('click', openModal);
document.getElementById('btn-logout')?.addEventListener('click', () => {
  supabaseClient.auth.signOut();
});

authToggleLink?.addEventListener('click', toggleAuthMode);
authClose?.addEventListener('click', closeModal);

// Close on outside click (only if allowed)
authModal?.addEventListener('click', (e) => {
  if (e.target === authModal) closeModal();
});
