apiVersion: apps/v1
kind: Deployment
metadata:
  name: ngrok
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ngrok
  template:
    metadata:
      labels:
        app: ngrok
    spec:
      containers:
        - name: ngrok
          image: __NGROK_IMAGE__
          command:
            - /bin/sh
            - -c
          args:
            - |
              if [ -n "$NGROK_DOMAIN" ]; then
                exec ngrok http --log=stdout --url="$NGROK_DOMAIN" nginx:80
              else
                exec ngrok http --log=stdout nginx:80
              fi
          env:
            - name: NGROK_AUTHTOKEN
              valueFrom:
                secretKeyRef:
                  name: ngrok-secret
                  key: NGROK_AUTHTOKEN
            - name: NGROK_DOMAIN
              valueFrom:
                secretKeyRef:
                  name: ngrok-secret
                  key: NGROK_DOMAIN
            - name: NGROK_DOMAIN_ID
              valueFrom:
                secretKeyRef:
                  name: ngrok-secret
                  key: NGROK_DOMAIN_ID
