import { useFlow } from "react-maestro-flow";
import { Button } from "../components/Button";
import { PageLayout } from "../components/PageLayout";

export default function PageD() {
	const {
		goToPrevious,
		currentPage,
		stateKey,
		updateStateBatch,
		getPageState,
	} = useFlow();
	const [confirm] = stateKey<boolean>("confirm");

	// Read from specific pages to show both "name" fields (page-scoped, no collision)
	const pageAName = getPageState("pageA").name as string | undefined;
	const pageCName = getPageState("pageC").name as string | undefined;
	const pageBEmail = getPageState("pageB").email as string | undefined;
	const pageCNotes = getPageState("pageC").notes as string | undefined;

	return (
		<PageLayout>
				<h1 className="text-3xl font-bold">Page D</h1>
				<p className="text-muted-foreground">
					Final page! You should have skipped Page C.
				</p>

				<div className="space-y-4">
					<div className="p-4 bg-muted rounded-md">
						<h3 className="font-semibold mb-2">
							Summary (getPageState per page — same &quot;name&quot; key, no collision)
						</h3>
						<p className="text-sm">
							<strong>Name (Page A):</strong>{" "}
							{pageAName || "Not provided"}
						</p>
						<p className="text-sm">
							<strong>Nickname (Page C, also &quot;name&quot;):</strong>{" "}
							{pageCName || "Not provided"}
						</p>
						<p className="text-sm">
							<strong>Email (Page B):</strong> {pageBEmail || "Not provided"}
						</p>
						{pageCNotes && (
							<p className="text-sm">
								<strong>Notes (Page C):</strong> {pageCNotes}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={confirm || false}
								onChange={(e) => {
									const checked = e.target.checked;
									// updateStateBatch: set multiple keys at once (page-scoped)
									updateStateBatch(
										checked
											? { confirm: true, confirmedAt: new Date().toISOString() }
											: { confirm: false },
									);
								}}
								className="w-4 h-4"
							/>
							<span>I confirm the information is correct</span>
						</label>
					</div>
				</div>

				<div className="flex justify-start">
					<Button variant="secondary" onClick={goToPrevious}>
						← Back
					</Button>
				</div>

				<div className="mt-4 p-4 bg-muted rounded-md">
					<p className="text-sm text-muted-foreground">
						Current page: {currentPage}
					</p>
				<p className="text-sm text-muted-foreground mt-2">
					Back goes to Page B (skipped Page C won&apos;t appear in history).
				</p>
				</div>
		</PageLayout>
	);
}
