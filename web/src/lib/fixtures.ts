import type { Board } from "./board";
import { DEFAULT_THEME } from "./theme";

// A small board-mode fixture that exercises every block type, used to drive
// the renderer until the full template converter (P2) lands.
export const sampleBoard: Board = {
  mode: "board",
  theme: DEFAULT_THEME,
  banner: { title: "Franchisee Journey", badge: { icon: { name: "calendar-days" }, text: "Cool Down: 15 Days" } },
  edges: [],
  sections: [
    {
      type: "columns",
      columns: [
        {
          header: { num: "1", title: "Account Access", sub: "Login & Dashboard", color: "gray" },
          nodes: [
            {
              id: "n1",
              blocks: [
                { type: "titleRow", icon: { name: "check" }, iconBg: "green", text: "Franchisee Logs Into Account" },
                { type: "text", text: "Franchisee logs into the WordPress platform to access their application statuses." },
                { type: "field", label: "Platform:", value: "WordPress", strong: true },
                { type: "button", style: "primary", text: "Login to Account" },
                { type: "button", style: "outline", icon: { name: "list" }, text: "View All Applications" },
                { type: "band", text: "Timeline: 7 Business Days Review Period" },
              ],
            },
          ],
        },
        {
          header: { num: "3", title: "Cool Down Period", sub: "15-Day Timer", color: "blue" },
          nodes: [
            {
              id: "n2",
              blocks: [
                { type: "titleRow", icon: { name: "clock" }, iconBg: "blue", text: "Trigger Cool Down Period" },
                { type: "text", text: "Mandatory 15-day waiting period to assess application validation." },
                { type: "list", items: ["Timer: 15 days", "Weekly reset: Mondays"] },
                { type: "button", style: "primary", text: "Start Timer", trailingIcon: { name: "chevron-right" } },
                {
                  type: "callout",
                  kind: "note",
                  icon: { name: "mail" },
                  title: "NOTIFICATIONS",
                  blocks: [
                    { type: "text", accentPrefix: "Franchisee:", text: "Cool down period started" },
                    { type: "chip", icon: { name: "message-circle" }, text: "Sana to share email content" },
                  ],
                },
              ],
            },
          ],
        },
        {
          header: { num: "5", title: "Ready for Submission", sub: "Cool Down Complete", color: "amber" },
          nodes: [
            {
              id: "n3",
              blocks: [
                { type: "titleRow", icon: { name: "clipboard-list" }, iconBg: "amber", text: "Application Under Review" },
                { type: "field", label: "Status:", value: "Pending", strong: true },
                {
                  type: "callout",
                  kind: "warn",
                  icon: { name: "alert-triangle" },
                  title: "Withdraw During Process",
                  blocks: [{ type: "text", text: "Withdraw available during review process" }],
                },
              ],
            },
            {
              id: "n4",
              accent: "danger",
              tag: "ALWAYS AVAILABLE",
              blocks: [
                { type: "titleRow", icon: { name: "x" }, iconBg: "red", text: "Application Withdrawn" },
                { type: "text", text: "Franchisee can withdraw application anytime during process" },
                { type: "button", style: "danger", text: "Withdraw Application" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
