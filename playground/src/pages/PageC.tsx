import { useEffect, useState } from "react";
import { useWizard } from "react-maestro";
import { Button } from "../components/Button";
import { PageLayout } from "../components/PageLayout";

export default function PageC() {
	const { goToNext, goToPrevious, skipCurrentPage } = useWizard();
	const [isChecking, setIsChecking] = useState(true);

	// Example: Check if page should be skipped after loading (e.g., API call)
	// This demonstrates conditional skipping during page load
	useEffect(() => {
		// Simulate an async check (API call, etc.)
		const checkShouldSkip = async () => {
			// Simulate API delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Example: Check some condition (could be API response, state, etc.)
			// In this case, we'll always skip, but you could check state or API response
			const shouldSkip = true; // Replace with your actual condition

			if (shouldSkip) {
				// Skip this page and navigate to next
				skipCurrentPage();
			} else {
				setIsChecking(false);
			}
		};

		checkShouldSkip();
	}, [skipCurrentPage]);

	// Show loader while checking
	if (isChecking) {
		return (
			<PageLayout>
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-muted-foreground">Checking conditions...</div>
				</div>
			</PageLayout>
		);
	}

	// This content would only show if the page is not skipped
	return (
		<PageLayout>
				<h1 className="text-3xl font-bold">Page C</h1>
				<p className="text-muted-foreground">
					This page would only render if the skip check returned false.
				</p>

				<div className="flex justify-between">
					<Button variant="secondary" onClick={goToPrevious}>
						← Back
					</Button>
					<Button onClick={goToNext}>Next →</Button>
				</div>
		</PageLayout>
	);
}
