import { useWizard } from "react-maestro";
import { Button } from "../components/Button";
import { PageLayout } from "../components/PageLayout";

export default function PageD() {
	const { goToPrevious, currentPage, stateKey } = useWizard();
	const [name] = stateKey<string>("name");
	const [email] = stateKey<string>("email");
	const [confirm, setConfirm] = stateKey<boolean>("confirm");

	return (
		<PageLayout>
				<h1 className="text-3xl font-bold">Page D</h1>
				<p className="text-muted-foreground">
					Final page! You should have skipped Page C.
				</p>

				<div className="space-y-4">
					<div className="p-4 bg-muted rounded-md">
						<h3 className="font-semibold mb-2">Summary</h3>
						<p className="text-sm">
							<strong>Name:</strong> {name || "Not provided"}
						</p>
						<p className="text-sm">
							<strong>Email:</strong> {email || "Not provided"}
						</p>
					</div>

					<div className="space-y-2">
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={confirm || false}
								onChange={(e) => setConfirm(e.target.checked)}
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
						Note: Going back should take you to Page B (skipping Page C)
					</p>
				</div>
		</PageLayout>
	);
}
