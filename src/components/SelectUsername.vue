<template>
  <div class="select-username">
    <form @submit.prevent="onSubmit">
      <input v-model="username" placeholder="Your username..." />
      <input type="submit" value="Send" />
    </form>
  </div>
</template>

<script>
export default {
  name: "SelectUsername",
  data() {
    return {
      username: ""
    };
  },
  computed: {
    isValid() {
      return this.username.length > 2;
    }
  },
  methods: {
    onSubmit() {
      console.log("subbmited");
      this.$emit("text-input", this.username);
    }
  }
};
</script>

<style scoped>
.select-username {
  width: 300px;
  margin: 200px auto 0;
}
</style>
