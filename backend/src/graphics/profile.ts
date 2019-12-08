import * as d3 from "d3";
import { JSDOM } from "jsdom";
import * as canvg from "canvg";
import { createCanvas } from "./tools";
import { Image } from "canvas";

export interface ProfileGraphicValue {
    champion: string;
    color: string;
    score: number;
}

export default function generateProfileGraphic(values: ProfileGraphicValue[]) {
    const { document } = new JSDOM(`<svg id="svg" width="399" height="240"></svg>`).window;
    (<any>global).document = document; // d3 expects this

    // Find SVG element, width, height.
    const svg = d3.select("svg");
    const margin = { top: 4, right: 0, bottom: 65, left: 44 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    // Prepare x and y axis domains.
    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
    const y = d3.scaleLinear().rangeRound([height, 0]);
    x.domain(values.map(x => x.champion));
    y.domain([0, values[0].score]);

    // Create our content node.
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create our X-axis.
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .attr("text-anchor", "end")
        .attr("fill", "#88939c")
        .attr("font", "13px \"Noto Sans KR\", \"Noto Sans\"")
        .attr("style", "font-size: 13px");

    // Create our Y-axis.
    g.append("g")
        .call(d3.axisLeft(y).ticks(7, "s"))
        .selectAll("text")
        .attr("fill", "#88939c")
        .attr("font", "13px \"Noto Sans KR\", \"Noto Sans\"")
        .attr("style", "font-size: 13px");

    // Create our actual bars.
    g.selectAll(".bar")
        .data(values)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.champion)!)
        .attr("y", d => y(d.score))
        .attr("fill", d => d.color)
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.score));

    // We need to do this to have the tick lines show up.
    // For some reason d3 doesn't really have a good way to make this work.
    Array.from(document.querySelectorAll(".domain")).forEach(x => x.setAttribute("stroke", "#595d61"));
    Array.from(document.querySelectorAll(".tick > line")).forEach(x => x.setAttribute("stroke", "#595d61"));

    // Render to the canvas.
    const canvas: any = createCanvas(399, 240);
    canvg(canvas, document.body.innerHTML, <any>{ ignoreMouse: true, ignoreAnimation: true, ImageClass: Image });

    delete (<any>global).document; // clean up after ourselves

    return canvas.toBuffer("image/png");
}