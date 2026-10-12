"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";

const tooltipStyle = { background: "#13243b", border: "1px solid #304762", borderRadius: 8, color: "#eef5ff", fontSize: 11 };
export const progressionData: Array<{ name: string; score: number; average: number }> = [];
function ChartEmpty() { return <div className="empty" style={{ height: 220 }}><BarChart3 size={25} /><p>Verified data will appear here after Firebase is configured.</p></div>; }
export function ProgressionChart({ tall = false }: { tall?: boolean }) { if (!progressionData.length) return <ChartEmpty />; return <div className={`chart ${tall ? "chart-tall" : ""}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={progressionData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}><CartesianGrid stroke="#20334d" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#7890aa", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#7890aa", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Line type="monotone" dataKey="score" name="My score" stroke="#6ea8fe" strokeWidth={3} dot={{ fill: "#6ea8fe", r: 4 }} /><Line type="monotone" dataKey="average" name="Class average" stroke="#8f9eb2" strokeDasharray="5 5" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>; }
export function DistributionChart() { return <ChartEmpty />; }
export function SubjectChart() { return <ChartEmpty />; }
export function ParticipationChart() { return <ChartEmpty />; }
