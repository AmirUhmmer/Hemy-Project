//push test
export class HistogramPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(extension, id, title, options) {
        super(extension.viewer.container, id, title, options);
        this.extension = extension;
        this.container.style.left = (options.x || 0) + 'px';
        this.container.style.top = (options.y || 0) + 'px';
        this.container.style.width = (options.width || 350) + 'px';
        this.container.style.height = (options.height || 300) + 'px';
        // this.container.style.resize = 'none';
        this.container.style.resize = "auto";
        this.container.style.overflow = 'hidden';  // Hide overflow
    }

    initialize() {
        this.title = this.createTitleBar(this.titleLabel || this.container.id);
        this.initializeMoveHandlers(this.title);
        this.container.appendChild(this.title);

        this.closer = this.createCloseButton();
        this.container.appendChild(this.closer);
    
        // Create content to display the dbId
        this.content = document.createElement('div');
        this.content.style.height = '100%';
        this.content.style.backgroundColor = '#333';
        this.content.style.padding = '1em'; // Increase padding for more space
    
        // Add placeholder for displaying dbId
        this.dbIdDisplay = document.createElement('div');
        this.dbIdDisplay1 = document.createElement('div');
        this.dbIdDisplay2 = document.createElement('div');
        this.dbIdDisplay3 = document.createElement('div');
        this.dbIdDisplay4 = document.createElement('div');
        this.dbIdDisplay5 = document.createElement('div');
        this.dbIdDisplay.innerHTML = '<strong style="display: inline-block; padding-top: -10px;">Selected Room:</strong> <span id="spriteDbId">None</span>';
        this.dbIdDisplay1.innerHTML = '<strong style="display: inline-block; padding-top: 10px;">Temperature: </strong> <span id="spriteTemp">0</span>';
        this.dbIdDisplay2.innerHTML = '<strong style="display: inline-block; padding-top: 10px;">As of </strong> <span id="spriteTime">Lorem Ipsum</span>';
        this.dbIdDisplay3.innerHTML = '<strong style="display: inline-block; padding-top: 10px;">MS Fabrics: </strong> <a style="color: #3399FF;" id="MSFabricsURL" href="https://app.powerbi.com/groups/c9e86663-87b6-49cf-b5b2-a79d6a01d7dd/list?experience=power-bi" target="_blank">View the MS Fabrics</a>'
        this.dbIdDisplay4.innerHTML = '<strong style="display: inline-block; padding-top: 10px;">Power BI Reports: </strong> <a style="color: #3399FF;" id="BIReports" href="https://app.powerbi.com/groups/c9e86663-87b6-49cf-b5b2-a79d6a01d7dd/list?experience=power-bi&subfolderId=1978" target="_blank">View the Power BI Reports</a>'
        this.dbIdDisplay5.innerHTML = '<strong style="display: inline-block; padding-top: 10px;">Specific Report for this data point: </strong> <a style="color: #3399FF;" id="SpecificReport" href="https://app.powerbi.com/reportEmbed?reportId=f6f9c99d-e70d-4a97-94dc-375d0d0a9af7&autoAuth=true&ctid=ead65215-ebfd-4a8d-9e73-b403a85a7e04&filter=RelynkIdentifier0711/point_name%20eq%20%27Current%27%20and%20RelynkIdentifier0711/is_point_of_furniture_name%20eq%20%27Small%20Meeting/Office%20(DB8.-.1.004)%27" target="_blank">View Report</a>'
        this.content.appendChild(this.dbIdDisplay);
        this.content.appendChild(this.dbIdDisplay1);
        this.content.appendChild(this.dbIdDisplay2);
        this.content.appendChild(this.dbIdDisplay3);
        this.content.appendChild(this.dbIdDisplay4);
        this.content.appendChild(this.dbIdDisplay5);
    
        // Create a canvas element for the bar chart
        this.chartContainer = document.createElement('div');
        this.chartContainer.style.marginTop = '20px';
        this.chartContainer.style.width = '100%'; // Ensure it takes full width
        this.chartContainer.innerHTML = '<canvas id="spriteBarChart"></canvas>';
        this.content.appendChild(this.chartContainer);
    
        this.container.appendChild(this.content);
    
        // Initialize the chart
        // this.initializeChart();
    }
    
    // initializeChart() {
    //     const ctx = this.content.querySelector('#spriteBarChart').getContext('2d');
    
    //     this.chart = new Chart(ctx, {
    //         type: 'line', 
    //         data: {
    //             labels: [], // Empty labels to start with
    //             datasets: [{
    //                 label: 'Temperature',
    //                 data: [], // Empty data to start with
    //                 backgroundColor: 'rgba(54, 162, 235, 0.2)',
    //                 borderColor: '#36A2EB',
    //                 borderWidth: 2,
    //                 fill: true,
    //                 tension: 0.4
    //             }]
    //         },
    //         options: {
    //             responsive: true, // Ensure it is responsive to the container size
    //             maintainAspectRatio: false, // Allow it to expand freely
    //             scales: {
    //                 x: {
    //                     ticks: {
    //                         maxRotation: 0, // Keeps x-axis labels from rotating
    //                         minRotation: 0,
    //                         padding: 10 // Increase space between ticks
    //                     },
    //                     grid: {
    //                         display: false // Hides grid lines to give it a cleaner look
    //                     }
    //                 },
    //                 y: {
    //                     beginAtZero: true,
    //                     ticks: {
    //                         stepSize: 5 // Adjust step size to have more spread between y-values
    //                     }
    //                 }
    //             },
    //             layout: {
    //                 padding: {
    //                     top: 20,
    //                     left: 20,
    //                     right: 20,
    //                     bottom: 20
    //                 }
    //             }
    //         }
    //     });
    // }
    
    
    
    // initializeChart() {
    //     // Get the chart canvas element
    //     const ctx = this.content.querySelector('#spriteBarChart').getContext('2d');
    
    //     // Create a sample line chart using Chart.js
    //     this.chart = new Chart(ctx, {
    //         type: 'line', // Change from 'bar' to 'line'
    //         data: {
    //             labels: ['Value 1', 'Value 2', 'Value 3'], // Sample labels
    //             datasets: [{
    //                 label: 'Sample Data',
    //                 data: [12, 19, 3], // Sample data
    //                 backgroundColor: 'rgba(54, 162, 235, 0.2)', // Light fill under the line
    //                 borderColor: '#36A2EB', // Line color
    //                 borderWidth: 2,
    //                 fill: true, // Fill the area under the line
    //                 tension: 0.4 // Smooth the line curve
    //             }]
    //         },
    //         options: {
    //             scales: {
    //                 y: {
    //                     beginAtZero: true
    //                 }
    //             }
    //         }
    //     });
    // }
    
    

    // Call this function to update the dbId in the panel when a sprite is clicked
    updateSpriteInfo(name, data) {
        console.log('Updating chart with data for: ' + name);
    
        const spriteDbIdElement = this.content.querySelector('#spriteDbId');
        const spriteTempElement = this.content.querySelector('#spriteTemp');
        const spriteTimeElement = this.content.querySelector('#spriteTime');
        const specificReportLink = this.content.querySelector('#SpecificReport');  // Select the hyperlink with the ID 'SpecificReport'
        if (spriteDbIdElement) {
            spriteDbIdElement.textContent = name ? name : 'None';
            spriteTempElement.textContent = data[0].value + '°C';
            spriteTimeElement.textContent = data[0].observationTime
            if (specificReportLink) {
                specificReportLink.href = 'https://app.powerbi.com/reportEmbed?reportId=f6f9c99d-e70d-4a97-94dc-375d0d0a9af7&autoAuth=true&ctid=ead65215-ebfd-4a8d-9e73-b403a85a7e04&filter=RelynkIdentifier0711%2Fpoint_name+eq+%27Current%27+and+RelynkIdentifier0711%2Fis_point_of_furniture_name+eq+%27' + name + '%27';
            }
        } else {
            console.error('Failed to find #spriteDbId element.');
        }
    
        // // Prepare the data for the chart
        // const labels = data.map(item => item.observationTime); // observationTime for x-axis
        // const values = data.map(item => item.value); // value for y-axis
    
        // // Update the chart
        // this.chart.data.labels = labels;
        // this.chart.data.datasets[0].data = values;
    
        // // Re-render the chart
        // this.chart.update();
    }



    // updateSpriteInfo(name) {
    //     console.log('CONTENT UPDATE ' + name);
    //     const spriteDbIdElement = this.content.querySelector('#spriteDbId');
    //     if (spriteDbIdElement) {
    //         spriteDbIdElement.textContent = name ? name : 'None';
    //     } else {
    //         console.error('Failed to find #spriteDbId element.');
    //     }
    // }

    // Show the panel when a sprite is clicked
    setVisible(visible) {
        this.container.style.display = visible ? 'block' : 'none';
    }
}








// export class HistogramPanel extends Autodesk.Viewing.UI.DockingPanel {
//     constructor(extension, id, title, options) {
//         super(extension.viewer.container, id, title, options);
//         this.extension = extension;
//         this.container.style.left = (options.x || 0) + 'px';
//         this.container.style.top = (options.y || 0) + 'px';
//         this.container.style.width = (options.width || 500) + 'px';
//         this.container.style.height = (options.height || 400) + 'px';
//         this.container.style.resize = 'none';
//         this.chartType = options.chartType || 'bar'; // See https://www.chartjs.org/docs/latest for all the supported types of charts
//         this.chart = this.createChart();
//     }

//     initialize() {
//         this.title = this.createTitleBar(this.titleLabel || this.container.id);
//         this.initializeMoveHandlers(this.title);
//         this.container.appendChild(this.title);
//         this.content = document.createElement('div');
//         this.content.style.height = '350px';
//         this.content.style.backgroundColor = 'black';
//         this.content.innerHTML = `
//             <div style="position: relative; height: 25px; padding: 0.5em;">
//                 <h1 class="props-container">HELLO</h1>
//                 <select class="props"></select>
//             </div>
//             <div class="chart-container" style="position: relative; height: 325px; padding: 0.5em;">
//                 <canvas class="chart"></canvas>
//             </div>
//         `;
//         this.select = this.content.querySelector('select.props');
//         this.canvas = this.content.querySelector('canvas.chart');
//         this.container.appendChild(this.content);
//     }

//         updateSpriteInfo(dbId) {
//         console.log('CONTENT UPDATE ' + dbId);
//         const spriteDbIdElement = this.content.querySelector('select.props');
//         if (spriteDbIdElement) {
//             console.error('SELECTEEEEED' + spriteDbIdElement);
//             spriteDbIdElement.textContent = dbId ? dbId : 'None';
//         } else {
//             console.error('Failed to find #spriteDbId element.');
//         }
//     }

//     createChart() {
//         return new Chart(this.canvas.getContext('2d'), {
//             type: this.chartType,
//             data: {
//                 labels: [],
//                 datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }],
//             },
//             options: { maintainAspectRatio: false }
//         });
//     }

//     async setModel(model) {
//         const propertyNames = await this.extension.findPropertyNames(model);
//         this.select.innerHTML = propertyNames.map(prop => `<option value="${prop}">${prop}</option>`).join('\n');
//         this.select.onchange = () => this.updateChart(model, this.select.value);
//         this.updateChart(model, this.select.value);
//     }

//     async updateChart(model, propName) {
//         const histogram = await this.extension.findPropertyValueOccurrences(model, propName);
//         const propertyValues = Array.from(histogram.keys());
//         this.chart.data.labels = propertyValues;
//         const dataset = this.chart.data.datasets[0];
//         dataset.label = propName;
//         dataset.data = propertyValues.map(val => histogram.get(val).length);
//         if (dataset.data.length > 0) {
//             const hslaColors = dataset.data.map((val, index) => `hsla(${Math.round(index * (360 / dataset.data.length))}, 100%, 50%, 0.2)`);
//             dataset.backgroundColor = dataset.borderColor = hslaColors;
//         }
//         this.chart.update();
//         this.chart.config.options.onClick = (ev, items) => {
//             if (items.length === 1) {
//                 const index = items[0].index;
//                 const dbids = histogram.get(propertyValues[index]);
//                 this.extension.viewer.isolate(dbids);
//                 this.extension.viewer.fitToView(dbids);
//             }
//         };
//     }
// }