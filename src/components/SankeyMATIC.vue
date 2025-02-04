<template>
    <h2>SankeyMATIC file</h2>
    <p>
        Go to
        <a href="https://sankeymatic.com/build/" target="_blank" rel="noopener noreferrer">sankeymatic.com/build/</a>
        and load the file.
    </p>
    <button class="btn btn-primary" @click="downloadSankeyFile">
        Download Sankey File
    </button>
    <br /><br />
    <pre>{{ sankeyFlows }}</pre>
    <button class="btn btn-secondary" @click="copySankeyToClipboard">
        Copy to clipboard
    </button>
</template>

<script>
export default {
    props: {
        budgetMonthCategories: Array
    },
    computed: {
        sankeyFlows() {
            return this.generateSankeyFlows(this.budgetMonthCategories);
        }
    },
    methods: {
        // Main method to generate Sankey flows
        generateSankeyFlows(budgetMonthCategories) {
            let flows = '';
            let groupValues = {};
            let categoriesByGroup = {};

            // Process each category and aggregate necessary values
            this.processCategories(budgetMonthCategories, groupValues, categoriesByGroup);

            // Sort groups and categories, and generate the flow
            const sortedGroups = this.sortGroupsByActivity(groupValues);
            flows = this.buildFlow(sortedGroups, groupValues, categoriesByGroup);

            return flows;
        },

        // Process each category, aggregate activity and group data
        processCategories(budgetMonthCategories, groupValues, categoriesByGroup) {
            budgetMonthCategories.forEach(category => {
                // Skip hidden or deleted categories
                if (category.hidden || category.deleted) {
                    return;
                }

                const activityAmount = this.calculateActivityAmount(category.activity);

                // Only add flow if activityAmount is greater than 0
                if (activityAmount > 0) {
                    this.addCategoryToGroup(category, activityAmount, categoriesByGroup);
                    this.updateGroupValues(category.category_group_name, activityAmount, groupValues);
                }
            });
        },

        // Calculate the activity amount (convert negative to positive and divide by 1000)
        calculateActivityAmount(activity) {
            return activity < 0 ? Math.ceil(Math.abs(activity) / 1000) : 0;
        },

        // Add the category to its corresponding group in categoriesByGroup
        addCategoryToGroup(category, activityAmount, categoriesByGroup) {
            const categoryGroupName = category.category_group_name;
            if (!categoriesByGroup[categoryGroupName]) {
                categoriesByGroup[categoryGroupName] = [];
            }
            categoriesByGroup[categoryGroupName].push({
                name: category.name,
                activityAmount
            });
        },

        // Update the group values (sum of activities for each group)
        updateGroupValues(groupName, activityAmount, groupValues) {
            if (!groupValues[groupName]) {
                groupValues[groupName] = 0;
            }
            groupValues[groupName] += activityAmount;
        },

        // Sort the groups based on their total activity (ascending, for biggest at bottom)
        sortGroupsByActivity(groupValues) {
            return Object.keys(groupValues).sort((a, b) => groupValues[a] - groupValues[b]);
        },

        // Build the flow string by iterating over sorted groups and categories
        buildFlow(sortedGroups, groupValues, categoriesByGroup) {
            let flowString = '';

            sortedGroups.forEach(groupName => {
                flowString += `Budgeted [${groupValues[groupName]}] ${groupName}\n`;

                // Sort categories within each group by activity (ascending, for biggest at bottom)
                const sortedCategories = categoriesByGroup[groupName].sort((a, b) => a.activityAmount - b.activityAmount);

                // Add the flows for the categories within the group
                sortedCategories.forEach(category => {
                    flowString += `${groupName} [${category.activityAmount}] ${category.name}\n`;
                });
            });

            return flowString;
        },


        downloadSankeyFile() {
            const blob = new Blob([this.sankeyFlows], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "sankeymatic.txt";
            link.click();
        },
        copySankeyToClipboard() {
            navigator.clipboard.writeText(this.sankeyFlows);
        }
    }
};
</script>
