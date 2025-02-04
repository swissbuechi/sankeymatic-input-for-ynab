<template>
    <div>
      <h2>Select a Month</h2>
      <select :value="selectedMonth" @change="onSelectMonth">
        <option v-for="month in months" :key="month.month" :value="month.month">
          {{ month.name }}
        </option>
        <option v-if="months.length === 0" disabled>No months available</option>
      </select>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      months: Array,
      selectedMonth: String
    },
    methods: {
      onSelectMonth(event) {
        this.$emit('update:selectedMonth', event.target.value);
      }
    }
  };
  </script>
  