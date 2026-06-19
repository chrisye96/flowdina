import BoardView from "@/components/BoardView";
import { sampleBoard } from "@/lib/fixtures";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#f3f4f6",
        padding: 22,
        display: "flex",
        justifyContent: "center",
        overflow: "auto",
      }}
    >
      <BoardView board={sampleBoard} />
    </main>
  );
}
