import { useWizard } from "react-maestro";
import { Button } from "../components/Button";
import { PageLayout } from "../components/PageLayout";

export default function PageB() {
	const { goToNext, goToPrevious, currentPage, stateKey } = useWizard();
	const [email, setEmail] = stateKey<string>("email");
	const [userType, setUserType] = stateKey<string>("userType");
	const [name] = stateKey<string>("name");

	return (
		<PageLayout>
				<h1 className="text-3xl font-bold">Page B</h1>
				<p className="text-muted-foreground">
					Hello, {name || "there"}! Enter your email and select user type. If
					you select "premium", you'll go to Page E. Otherwise, you'll go to
					Page C.
				</p>

				<div className="space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-medium mb-1">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email || ""}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
							placeholder="Enter your email"
						/>
					</div>

					<div>
						<label
							htmlFor="userType"
							className="block text-sm font-medium mb-1"
						>
							User Type
						</label>
						<select
							id="userType"
							value={userType || ""}
							onChange={(e) => setUserType(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
						>
							<option value="">Select user type</option>
							<option value="standard">Standard</option>
							<option value="premium">Premium</option>
						</select>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="secondary" onClick={goToPrevious}>
						← Back
					</Button>
					<Button onClick={goToNext} disabled={!email || !userType}>
						Next →
					</Button>
				</div>

				<div className="mt-4 p-4 bg-muted rounded-md">
					<p className="text-sm text-muted-foreground">
						Current page: {currentPage}
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						{userType === "premium"
							? "You'll be routed to Page E (Premium Feature)"
							: userType === "standard"
								? "You'll be routed to Page C (Standard Flow)"
								: "Select a user type to see routing"}
					</p>
				</div>
		</PageLayout>
	);
}
