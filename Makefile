run:
	python3 -m http.server 8080 --directory ./jess/

run_production:
	docker-compose up --build --abort-on-container-exit
