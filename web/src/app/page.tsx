import BoardView from "@/components/BoardView";
import { sampleBoard, flowBoard } from "@/lib/fixtures";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#f3f4f6",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        overflow: "auto",
      }}
    >
      <BoardView board={sampleBoard} />
      <BoardView board={flowBoard} />
    </main>
  );
}
