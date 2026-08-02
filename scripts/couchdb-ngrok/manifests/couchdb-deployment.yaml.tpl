apiVersion: apps/v1
kind: Deployment
metadata:
  name: couchdb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: couchdb
  template:
    metadata:
      labels:
        app: couchdb
    spec:
      initContainers:
        - name: copy-couchdb-config
          image: busybox:1.36
          command:
            - sh
            - -c
            - cp /config/local.ini /locald/local.ini
          volumeMounts:
            - name: couchdb-config
              mountPath: /config
            - name: couchdb-local-d
              mountPath: /locald
      containers:
        - name: couchdb
          image: __COUCHDB_IMAGE__
          ports:
            - containerPort: 5984
          env:
            - name: COUCHDB_USER
              valueFrom:
                secretKeyRef:
                  name: couchdb-admin
                  key: COUCHDB_USER
            - name: COUCHDB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: couchdb-admin
                  key: COUCHDB_PASSWORD
            - name: COUCHDB_SECRET
              valueFrom:
                secretKeyRef:
                  name: couchdb-admin
                  key: COUCHDB_SECRET
          volumeMounts:
            - name: couchdb-data
              mountPath: /opt/couchdb/data
            - name: couchdb-local-d
              mountPath: /opt/couchdb/etc/local.d
      volumes:
        - name: couchdb-data
          persistentVolumeClaim:
            claimName: couchdb-data
        - name: couchdb-config
          configMap:
            name: couchdb-config
        - name: couchdb-local-d
          emptyDir: {}
