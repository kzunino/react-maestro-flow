import { useFlow } from "react-maestro-flow";
import { Button } from "../components/Button";
import { PageLayout } from "../components/PageLayout";

export default function PageC() {
	const { goToNext, goToPrevious, stateKey } = useFlow();
	const [name, setName] = stateKey<string>("name");
	const [notes, setNotes] = stateKey<string>("notes");

	return (
		<PageLayout>
			<h1 className="text-3xl font-bold">Page C - Details</h1>
			<p className="text-muted-foreground">
				Optional details step. Uncheck &quot;Skip details step&quot; on Page B
				to see this. Uses same &quot;name&quot; key as Page A — stored in
				page-scoped state, no collision.
			</p>

			<div className="space-y-4">
				<div>
					<label
						htmlFor="pageC-name"
						className="block text-sm font-medium mb-1"
					>
						Nickname / Display name
					</label>
					<input
						id="pageC-name"
						type="text"
						value={name || ""}
						onChange={(e) => setName(e.target.value)}
						className="w-full px-3 py-2 border rounded-md"
						placeholder="e.g. How friends call you"
					/>
				</div>
				<div>
					<label htmlFor="notes" className="block text-sm font-medium mb-1">
						Additional notes
					</label>
					<textarea
						id="notes"
						value={notes || ""}
						onChange={(e) => setNotes(e.target.value)}
						className="w-full px-3 py-2 border rounded-md"
						placeholder="Any extra info..."
						rows={3}
					/>
				</div>
			</div>

			<div className="flex justify-between">
				<Button variant="secondary" onClick={goToPrevious}>
					← Back
				</Button>
				<Button onClick={goToNext}>Next →</Button>
			</div>
		</PageLayout>
	);
}
