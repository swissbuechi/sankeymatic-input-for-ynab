<template>
  <div class="container">
    <h5>SankeyMATIC Configuration</h5>
    <textarea class="form-control" rows="10" readonly>{{ flows }}</textarea>
  </div>
</template>

<script>
export default {
  props: ['flows'],
};
</script>

<style>
textarea {
  font-family: monospace;
}
</style>
