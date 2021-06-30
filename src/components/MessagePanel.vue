<template>
  <div>
    <div class="header">
      status icon
    </div>

    <ul class="messages">
      <li
        v-for="(message, index) in user.messages"
        :key="index"
        class="message"
      >
        <div v-if="displaySender(message, index)" class="sender">
          {{ message.fromSelf ? "(yourself)" : user.username }}:
        </div>
        {{ message.content }}
      </li>
    </ul>

    <form @submit.prevent="onSubmit" class="form">
      <textarea
        v-model="textInput"
        placeholder="Your message..."
        class="input"
      />
      <button :disabled="!isValid" class="send-button">Send</button>
    </form>
  </div>
</template>

<script scoped>
export default {
  name: "MessagePanel",
  // components: {
  //   StatusIcon,
  // },
  props: {
    user: Object
  },
  data() {
    return {
      textInput: ""
    };
  },
  methods: {
    onSubmit() {
      this.$emit("textInput", this.textInput);
      this.textInput = "";
    },
    displaySender(message, index) {
      console.log("message from chat:  ", message, "index: ", index);
      // if (!index) index = 0;
      return (
        index === 0 ||
        this.user.messages[index - 1].fromSelf !==
          this.user.messages[index].fromSelf
      );
    }
  },
  computed: {
    isValid() {
      return this.textInput.length > 0;
    }
  }
};
</script>

<style>
.header {
  line-height: 40px;
  padding: 10px 20px;
  border-bottom: 1px solid #dddddd;
}

.messages {
  margin: 0;
  padding: 20px;
}

.message {
  list-style: none;
}

.sender {
  font-weight: bold;
  margin-top: 5px;
}

.form {
  padding: 10px;
}

.input {
  width: 80%;
  resize: none;
  padding: 10px;
  line-height: 1.5;
  border-radius: 5px;
  border: 1px solid #000;
}
</style>
