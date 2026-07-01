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

// The franchise approval flow as a flow-mode board: spine nodes, a 3-way branch,
// a merge, and the connector graph. Drives flow-mode + edge rendering.
export const flowBoard: Board = {
  mode: "flow",
  theme: DEFAULT_THEME,
  edges: [
    { id: "e1", from: "appReceived", to: "step1", line: "elbow" },
    { id: "e2", from: "step1", to: "decision", line: "elbow" },
    { id: "e3", from: "decision", to: "step2", line: "elbow" },
    { id: "e4", from: "decision", to: "step3", line: "elbow" },
    { id: "e5", from: "decision", to: "step4", line: "elbow", label: "no review" },
    { id: "e6", from: "step4", to: "processEnds", line: "elbow" },
    { id: "e7", from: "step2", to: "awaiting", line: "elbow" },
    { id: "e8", from: "awaiting", to: "financialDone", line: "elbow" },
    { id: "e9", from: "financialDone", to: "postApproval", line: "elbow" },
    { id: "e10", from: "step3", to: "postApproval", line: "elbow" },
  ],
  sections: [
    { type: "node", node: { id: "appReceived", variant: "pill", pillColor: "blue", blocks: [{ type: "titleRow", icon: { name: "play" }, text: "Application Received" }] } },
    {
      type: "node",
      node: {
        id: "step1",
        header: { text: "STEP 1: ACCEPT APPLICATION", color: "amber" },
        blocks: [
          { type: "titleRow", icon: { name: "clock" }, iconBg: "amber", text: "Franchisor Actions:" },
          { type: "list", items: ["Franchisor logs in through their ID", "Compatibility score shown from WordPress", "Accept application for review", "Provide timeline (7 days wait)"] },
          { type: "band", text: "Timeline: 7 Business Days Review Period" },
        ],
      },
    },
    {
      type: "node",
      node: {
        id: "decision",
        accent: "decision",
        blocks: [
          { type: "titleRow", icon: { name: "zap" }, iconBg: "purple", text: "DECISION POINT" },
          { type: "text", text: "After 7-Day Review Period", tone: "muted", align: "center" },
          {
            type: "callout",
            kind: "warn",
            icon: { name: "alert-triangle" },
            title: "DISCLAIMER",
            blocks: [
              { type: "text", text: "If no action after 7 days, application will AUTO-DECLINE." },
              { type: "chip", icon: { name: "message-circle" }, text: "Sana to share email content" },
            ],
          },
        ],
      },
    },
    {
      type: "columns",
      columns: [
        {
          nodes: [
            {
              id: "step2",
              header: { text: "STEP 2: FINANCIAL CHECK", color: "blue" },
              blocks: [
                { type: "titleRow", icon: { name: "dollar-sign" }, iconBg: "blue", text: "Franchisor Actions:" },
                { type: "list", items: ["Click Financial Health Check Required", "System emails franchisee (5 business days)", "Declined if no action after 5 days"] },
                { type: "chip", icon: { name: "mail" }, text: "Sana to share email content" },
              ],
            },
            {
              id: "awaiting",
              accent: "state-blue",
              blocks: [
                { type: "titleRow", icon: { name: "hourglass" }, iconBg: "blue", text: "Awaiting Financial Submission" },
                { type: "text", text: "Franchisee has 5 business days to submit", tone: "muted", align: "center" },
              ],
            },
            {
              id: "financialDone",
              accent: "state-green",
              blocks: [
                { type: "titleRow", icon: { name: "check" }, iconBg: "green", text: "Financial Check Completed" },
                { type: "text", text: "Auto-synced from WordPress via API", tone: "muted", align: "center" },
              ],
            },
          ],
        },
        {
          nodes: [
            {
              id: "step3",
              header: { text: "STEP 3: APPLICATION APPROVED", color: "green" },
              blocks: [
                { type: "titleRow", icon: { name: "circle-check" }, iconBg: "green", text: "Franchisor Actions:" },
                { type: "list", items: ["Click Approve (no financial check)", "Application immediately approved", "System sends approval notification"] },
                {
                  type: "callout",
                  kind: "note",
                  icon: { name: "mail" },
                  title: "AUTOMATED EMAIL SENT",
                  blocks: [{ type: "text", text: "Franchisee notified of approval with next steps" }],
                },
              ],
            },
          ],
        },
        {
          nodes: [
            {
              id: "step4",
              accent: "danger",
              header: { text: "STEP 4: APPLICATION DECLINED", color: "red" },
              blocks: [
                { type: "titleRow", icon: { name: "circle-x" }, iconBg: "red", text: "Franchisor Actions:" },
                { type: "list", items: ["Click Decline button"] },
                { type: "chip", icon: { name: "mail" }, text: "Sana to share email content" },
              ],
            },
            { id: "processEnds", variant: "pill", pillColor: "red", blocks: [{ type: "titleRow", icon: { name: "ban" }, text: "Process Ends" }] },
          ],
        },
      ],
    },
    { type: "caption", text: "Both approval paths converge here" },
    {
      type: "node",
      node: {
        id: "postApproval",
        header: { text: "POST-APPROVAL STATE", color: "green" },
        blocks: [
          { type: "titleRow", icon: { name: "circle-check" }, iconBg: "green", text: "Application Status: APPROVED" },
          { type: "list", items: ["Franchisee can proceed with onboarding", "WITHDRAWAL OPTION AVAILABLE", "All parties notified simultaneously"] },
        ],
      },
    },
  ],
};
