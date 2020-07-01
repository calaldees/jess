run_local:
	# Serve the html/js for jess (frontend) [8080]
	python3 -m http.server 8080 --directory ./jess/
run_local_server:
	# Run the websocket channel echo server [9800]
	${MAKE} --directory channelServer run_local

run_production:
	# Serve with docker on single port '80'
	docker-compose up --build --abort-on-container-exit
