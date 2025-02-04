<template>
  <div id="app">
    <Nav />
    <div class="container">
      <h1 v-if="loading" class="display-4">Loading...</h1>

      <div v-if="error">
        <h1 class="display-4">Oops!</h1>
        <p class="lead">{{ error }}</p>
        <button class="btn btn-primary" @click="resetToken">Try Again &gt;</button>
      </div>

      <div v-else>
        <form v-if="!ynab.token">
          <h1 class="display-4">Authorize YNAB</h1>
          <p class="lead">Authorize this app with YNAB to generate a input config for <a href="https://sankeymatic.com/build/" target="_blank" rel="noopener noreferrer">SankeyMATIC</a>.</p>
          <button @click="authorizeWithYNAB" class="btn btn-primary">Authorize This App With YNAB &gt;</button>
        </form>

        <div v-else-if="!budgetId">
          <h2>Select a Budget</h2>
          <Budgets :budgets="budgets" :selectBudget="selectBudget" />
        </div>

        <div v-else>
          <h2>Select a Month</h2>
          <select v-model="selectedMonth" @change="selectMonth">
            <option v-for="month in months" :key="month.month" :value="month.month">
              {{ month.name }}
            </option>
            <option v-if="months.length === 0" disabled>No months available</option>
          </select>

          <h2>SankeyMATIC input</h2>
          <p>Go to <a href="https://sankeymatic.com/build/" target="_blank" rel="noopener noreferrer">sankeymatic.com/build/</a> and paste into inputs.</p>
          <button class="btn btn-info" @click="copySankeyToClipboard">Copy to clipboard</button>
          <br><br>
          <pre>{{ sankeyFlows }}</pre>
          <button class="btn" @click="budgetId = null">&lt; Select Another Budget</button>
        </div>
      </div>

      <Footer />
    </div>
  </div>
</template>

<script>
import * as ynab from 'ynab';
import config from './config.json';
import Nav from './components/Nav.vue';
import Footer from './components/Footer.vue';
import Budgets from './components/Budgets.vue';

export default {
  data() {
    return {
      ynab: {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        token: null,
        api: null,
      },
      loading: false,
      error: null,
      budgetId: null,
      budgets: [],
      sankeyFlows: '',
      months: [],
      selectedMonth: 'current'
    };
  },
  created() {
    this.ynab.token = this.findYNABToken();
    if (this.ynab.token) {
      this.api = new ynab.API(this.ynab.token);
      this.getBudgets();
    }
  },
  methods: {
    async getBudgets() {
      this.loading = true;
      try {
        const res = await this.api.budgets.getBudgets();
        this.budgets = res.data.budgets;
      } catch (err) {
        this.error = err.error.detail || 'Failed to fetch budgets';
      } finally {
        this.loading = false;
      }
    },
    async selectBudget(id) {
      this.loading = true;
      this.budgetId = id;

      try {
        const { data: categoryData } = await this.api.categories.getCategories(id);
        const { data: monthsData } = await this.api.months.getBudgetMonths(id); // Fetch all months

        console.log('Months Data:', monthsData); // Debugging: Check structure

        // Ensure months are formatted correctly
        this.months = monthsData.months.map(month => ({
          month: month.month, // Already in YYYY-MM-DD format
          name: new Date(month.month).toLocaleString('default', { month: 'long', year: 'numeric' }) // Format for UI
        }));

        // Default to the latest month if no selection
        this.selectedMonth = this.months[0]?.month || null;
        
        // Fetch data for the default month
        if (this.selectedMonth) {
          this.selectMonth();
        }

      } catch (err) {
        this.error = err.error.detail || 'Failed to fetch budget details';
      } finally {
        this.loading = false;
      }
    },

    async selectMonth() {
      if (!this.selectedMonth || !this.budgetId) return;

      this.loading = true;

      try {
        const { data: categoryData } = await this.api.categories.getCategories(this.budgetId);
        const { data: monthData } = await this.api.months.getBudgetMonth(this.budgetId, this.selectedMonth);

        console.log('Selected Month Data:', monthData); // Debugging: Verify data structure

        this.sankeyFlows = this.generateSankeyFlows(categoryData.category_groups, monthData.month);
      } catch (err) {
        this.error = err.error.detail || 'Failed to fetch budget details for selected month';
      } finally {
        this.loading = false;
      }
    },
    generateSankeyFlows(categoryGroups, month) {
      const root = {
        id: '__ROOT__',
        name: 'Budgeted',
        value: Math.floor(Math.abs(month.activity) / 1000),
        children: [],
      };

      const categoriesByGroupId = month.categories.reduce((acc, category) => {
        if (acc[category.category_group_id]) {
          acc[category.category_group_id].push(category);
        } else {
          acc[category.category_group_id] = [category];
        }
        return acc;
      }, {});

      const excludedCategories = [
        'Internal Master Category',
        'Inflow: Ready to Assign',
      ];

      categoryGroups.forEach((group) => {
        if (group.hidden || group.deleted || !categoriesByGroupId[group.id]) return;

        const children = categoriesByGroupId[group.id]
          .filter((category) =>!category.hidden && !category.deleted && Math.abs(category.activity) > 0 &&!excludedCategories.includes(category.name))
          .map((category) => ({
            id: category.id,
            name: category.name,
            value: Math.floor(Math.abs(category.activity) / 1000),
            children: [],
          }));

        if (children.length > 0) {
          root.children.push({
            id: group.id,
            name: group.name,
            value: children.reduce((sum, child) => sum + child.value, 0),
            children,
          });
        }
      });
      
      return this.generateSankeyFormat(root);
    },
    generateSankeyFormat(node) {
      const flows = [];
      
      const traverse = (parent, children) => {
        children.forEach((child) => {
          flows.push(`${parent.name} [${child.value}] ${child.name}`);
          if (child.children.length > 0) {
            traverse(child, child.children);
          }
        });
      };
      
      traverse(node, node.children);
      return flows.join('\n');
    },
    copySankeyToClipboard() {
      navigator.clipboard.writeText(this.sankeyFlows).then(() => {
      }).catch((err) => {
        console.error('Failed to copy text: ', err);
      });
    },
    authorizeWithYNAB(e) {
      e.preventDefault();
      const uri = `https://app.ynab.com/oauth/authorize?client_id=${this.ynab.clientId}&redirect_uri=${this.ynab.redirectUri}&response_type=token&scope=read-only`;
      location.replace(uri);
    },
    findYNABToken() {
      const hash = window.location.hash.substring(1);
      if (hash) {
        const params = Object.fromEntries(new URLSearchParams(hash));
        const token = params.access_token;
        sessionStorage.setItem('ynab_access_token', token);
        window.location.hash = '';
        return token;
      }
      return sessionStorage.getItem('ynab_access_token');
    },
    resetToken() {
      sessionStorage.removeItem('ynab_access_token');
      this.ynab.token = null;
      this.error = null;
    },
  },
  components: {
    Nav,
    Footer,
    Budgets,
  },
};
</script>
