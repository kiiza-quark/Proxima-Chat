from locust import HttpUser, task, between

class RAGUser(HttpUser):
    wait_time = between(1, 2)

    def on_start(self):
        login_data = {
            "email": "abc1@gmail.com",
            "password": "1234"
        }
        with self.client.post("/api/auth/login", json=login_data, catch_response=True) as response:
            if response.status_code == 200 and response.json().get("success"):
                self.token = response.json()["token"]
            else:
                response.failure("Failed to log in and get JWT token")
                self.token = None

    @task
    def chat(self):
        if not hasattr(self, "token") or not self.token:
            return  # Skip if login failed
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        data = {
            "message": "What is the summary of the uploaded document?"
        }
        self.client.post("/api/chat", json=data, headers=headers)