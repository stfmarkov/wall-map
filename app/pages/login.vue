<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

const supabase = useSupabaseClient()

const step = ref<'email' | 'code'>('email')
const email = ref('')
const code = ref('')
const pending = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const sendCode = async () => {
  errorMessage.value = ''
  infoMessage.value = ''
  pending.value = true

  const { error } = await supabase.auth.signInWithOtp({
    email: email.value.trim(),
  })

  pending.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  step.value = 'code'
  infoMessage.value = 'Check your email for a 6-digit code.'
}

const verifyCode = async () => {
  errorMessage.value = ''
  infoMessage.value = ''
  pending.value = true

  const { error } = await supabase.auth.verifyOtp({
    email: email.value.trim(),
    token: code.value.trim(),
    type: 'email',
  })

  pending.value = false

  if (error) {
    errorMessage.value = error.message
    return
  }

  await navigateTo('/')
}

const backToEmail = () => {
  step.value = 'email'
  code.value = ''
  errorMessage.value = ''
  infoMessage.value = ''
}

const onSubmit = async () => {
  if (step.value === 'email') {
    await sendCode()
  } else {
    await verifyCode()
  }
}
</script>

<template>
  <main class="login">
    <div class="login-panel">
      <p class="eyebrow">Wall Map</p>
      <h1>{{ step === 'email' ? 'Sign in' : 'Enter code' }}</h1>
      <p class="lede">
        {{
          step === 'email'
            ? 'We’ll email you a one-time code. No password needed.'
            : `Code sent to ${email.trim()}.`
        }}
      </p>

      <form class="form" @submit.prevent="onSubmit">
        <label v-if="step === 'email'" class="field">
          <span>Email</span>
          <input
            v-model="email"
            type="email"
            name="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            :disabled="pending"
          >
        </label>

        <label v-else class="field">
          <span>One-time code</span>
          <input
            v-model="code"
            type="text"
            name="otp"
            inputmode="numeric"
            autocomplete="one-time-code"
            pattern="[0-9]*"
            maxlength="8"
            required
            placeholder="123456"
            :disabled="pending"
          >
        </label>

        <p v-if="infoMessage" class="info">{{ infoMessage }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

        <div class="actions">
          <button type="submit" class="primary" :disabled="pending">
            <template v-if="pending">Working…</template>
            <template v-else-if="step === 'email'">Send code</template>
            <template v-else>Verify and sign in</template>
          </button>

          <button
            v-if="step === 'code'"
            type="button"
            class="ghost"
            :disabled="pending"
            @click="backToEmail"
          >
            Use a different email
          </button>
        </div>
      </form>

      <NuxtLink to="/" class="back">Back to map</NuxtLink>
    </div>
  </main>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, #2a3a2e 0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 80%, #1a2a38 0%, transparent 50%),
    #12161c;
  color: #e8e4dc;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.login-panel {
  width: min(100%, 22rem);
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #9bb09a;
}

h1 {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.lede {
  margin: 0.6rem 0 1.5rem;
  line-height: 1.45;
  color: #b7b2a8;
  font-size: 0.95rem;
}

.form {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #3a433c;
  border-radius: 8px;
  background: #1a201c;
  color: inherit;
  padding: 0.7rem 0.8rem;
  font: inherit;
  font-size: 1rem;
}

.field input:focus {
  outline: 2px solid #6f8f72;
  outline-offset: 1px;
}

.actions {
  display: grid;
  gap: 0.5rem;
}

.primary,
.ghost {
  appearance: none;
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  font: inherit;
  font-size: 0.95rem;
  cursor: pointer;
}

.primary {
  border: none;
  background: #c4d4a8;
  color: #12161c;
  font-weight: 600;
}

.primary:hover:not(:disabled) {
  background: #d2e0b8;
}

.primary:disabled,
.ghost:disabled {
  opacity: 0.6;
  cursor: wait;
}

.ghost {
  border: 1px solid #3a433c;
  background: transparent;
  color: inherit;
}

.ghost:hover:not(:disabled) {
  border-color: #5a655c;
}

.info {
  margin: 0;
  font-size: 0.9rem;
  color: #9bb09a;
}

.error {
  margin: 0;
  font-size: 0.9rem;
  color: #e8a090;
}

.back {
  display: inline-block;
  margin-top: 1.5rem;
  color: #9aa39a;
  font-size: 0.9rem;
}

.back:hover {
  color: #e8e4dc;
}
</style>
