import * as d3 from "d3";
import { parseHTML } from "linkedom";
import { renderSvg } from "./tools";

export interface ProfileGraphicValue {
    champion: string;
    color: string;
    score: number;
}

/**
 * Renders a bar chart of the specified champion scores. The first value must have the highest score.
 */
export default function generateProfileGraphic(values: ProfileGraphicValue[]) {
    const { document } = parseHTML(`<svg xmlns="http://www.w3.org/2000/svg" width="399" height="240"></svg>`);

    // Find SVG element, width, height.
    const svg = d3.select(document.querySelector("svg") as unknown as SVGSVGElement);
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
        .attr("font-family", "Noto Sans KR, Noto Sans")
        .attr("font-size", 13);

    // Create our Y-axis.
    g.append("g")
        .call(d3.axisLeft(y).ticks(7, "s"))
        .selectAll("text")
        .attr("fill", "#88939c")
        .attr("font-family", "Noto Sans KR, Noto Sans")
        .attr("font-size", 13);

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

    // d3 draws the axis lines in currentColor, which has no value outside a page.
    svg.selectAll(".domain, .tick > line").attr("stroke", "#595d61");

    return renderSvg(svg.node()!.outerHTML, 399, 240);
}
