import * as d3 from "d3";
import { JSDOM } from "jsdom";
import * as canvg from "canvg";
import { createCanvas, Image } from "canvas";
import { UserMasteryDelta } from "../database";

export default function generateStatsGraphic(beforeValues: UserMasteryDelta[]) {
    // TODO: Maybe translate dates here.
    const { document } = new JSDOM(`<svg id="svg" width="399" height="250"></svg>`).window;
    (<any>global).document = document; // d3 expects this

    const values = beforeValues.map(x => ({ value: x.value, timestamp: new Date(+x.timestamp) }));

    // Find SVG element, width, height.
    const svg = d3.select("svg");
    const margin = { top: 4, right: 6, bottom: 60, left: 44 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    // Prepare x and y axis domains.
    const x = d3.scaleTime().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([height, 0]);
    const line = d3.line<any>().x(d => x(d.timestamp)).y(d => y(d.value));
    x.domain(<any>d3.extent(values, d => d.timestamp));
    y.domain(<any>d3.extent(values, d => d.value));

    // Create our content node.
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create our X-axis.
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %Y")))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .attr("text-anchor", "end")
        .attr("fill", "#88939c")
        .attr("style", "font-size: 12px");

    // Create our Y-axis.
    g.append("g")
        .call(d3.axisLeft(y).ticks(7, "s"))
        .selectAll("text")
        .attr("fill", "#88939c")
        .attr("style", "font-size: 12px");

    // Create X gridlines.
    g.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(12).tickSize(-height).tickFormat(<any>""));

    // Create Y gridlines.
    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(<any>""));

    // Create the line.
    g.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // We need to do this to have the tick lines show up.
    // For some reason d3 doesn't really have a good way to make this work.
    Array.from(document.querySelectorAll(".domain")).forEach(x => x.setAttribute("stroke", "#595d61"));
    Array.from(document.querySelectorAll(".tick > line")).forEach(x => x.setAttribute("stroke", "#595d61"));
    Array.from(document.querySelectorAll(".grid line")).forEach(x => x.setAttribute("stroke-opacity", "0.5"));
    Array.from(document.querySelectorAll(".grid path")).forEach(x => x.setAttribute("stroke-width", "0"));

    // Render to the canvas.
    const canvas: any = createCanvas(399, 250);
    canvg(canvas, document.body.innerHTML, <any>{ ignoreMouse: true, ignoreAnimation: true, ImageClass: Image });

    delete (<any>global).document; // clean up after ourselves

    return canvas.toBuffer("image/png");
}