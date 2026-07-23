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

const title = computed(() => (step.value === 'email' ? 'Sign in' : 'Enter code'))
const lede = computed(() =>
  step.value === 'email'
    ? 'We’ll email you a one-time code. No password needed.'
    : `Code sent to ${email.value.trim()}.`,
)

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

  await navigateTo('/users/me')
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
  <AuthShell eyebrow="Wall Map" :title="title" :lede="lede">
    <form class="form" @submit.prevent="onSubmit">
      <UiField
        v-if="step === 'email'"
        v-model="email"
        label="Email"
        type="email"
        name="email"
        autocomplete="email"
        required
        placeholder="you@example.com"
        :disabled="pending"
      />

      <UiField
        v-else
        v-model="code"
        label="One-time code"
        type="text"
        name="otp"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]*"
        maxlength="8"
        required
        placeholder="123456"
        :disabled="pending"
      />

      <UiMessage v-if="infoMessage" variant="info">{{ infoMessage }}</UiMessage>
      <UiMessage v-if="errorMessage" variant="error">{{ errorMessage }}</UiMessage>

      <div class="actions">
        <UiButton type="submit" :disabled="pending">
          <template v-if="pending">Working…</template>
          <template v-else-if="step === 'email'">Send code</template>
          <template v-else>Verify and sign in</template>
        </UiButton>

        <UiButton
          v-if="step === 'code'"
          variant="ghost"
          :disabled="pending"
          @click="backToEmail"
        >
          Use a different email
        </UiButton>
      </div>
    </form>

    <template #footer>
      <NuxtLink to="/">Back to map</NuxtLink>
    </template>
  </AuthShell>
</template>

<style scoped>
.form {
  display: grid;
  gap: 1rem;
}

.actions {
  display: grid;
  gap: 0.5rem;
}
</style>
