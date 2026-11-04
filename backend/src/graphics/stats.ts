import * as d3 from "d3";
import { parseHTML } from "linkedom";
import { UserMasteryDelta } from "../database";
import { renderSvg } from "./tools";

/**
 * Renders a line chart of the mastery score over time.
 */
export default function generateStatsGraphic(beforeValues: UserMasteryDelta[]) {
    // TODO: Maybe translate dates here.
    const { document } = parseHTML(`<svg xmlns="http://www.w3.org/2000/svg" width="399" height="250"></svg>`);

    const values = beforeValues.map(x => ({ value: x.value, timestamp: new Date(+x.timestamp) }));

    // Find SVG element, width, height.
    const svg = d3.select(document.querySelector("svg") as unknown as SVGSVGElement);
    const margin = { top: 4, right: 6, bottom: 60, left: 44 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    // Prepare x and y axis domains.
    const x = d3.scaleTime().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([height, 0]);
    const line = d3.line<{ value: number, timestamp: Date }>().x(d => x(d.timestamp)).y(d => y(d.value));
    x.domain(d3.extent(values, d => d.timestamp) as [Date, Date]);
    y.domain(d3.extent(values, d => d.value) as [number, number]);

    // Create our content node.
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create our X-axis.
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %Y") as (date: Date | { valueOf(): number }) => string))
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .attr("text-anchor", "end")
        .attr("fill", "#88939c")
        .attr("font-family", "Noto Sans KR, Noto Sans")
        .attr("font-size", 12);

    // Create our Y-axis.
    g.append("g")
        .call(d3.axisLeft(y).ticks(7, "s"))
        .selectAll("text")
        .attr("fill", "#88939c")
        .attr("font-family", "Noto Sans KR, Noto Sans")
        .attr("font-size", 12);

    // Create X gridlines.
    g.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(12).tickSize(-height).tickFormat(() => ""));

    // Create Y gridlines.
    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""));

    // Create the line.
    g.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // d3 draws the axis lines in currentColor, which has no value outside a page.
    svg.selectAll(".domain, .tick > line").attr("stroke", "#595d61");
    svg.selectAll(".grid line").attr("stroke-opacity", "0.5");
    svg.selectAll(".grid path").attr("stroke-width", "0");

    return renderSvg(svg.node()!.outerHTML, 399, 250);
}
