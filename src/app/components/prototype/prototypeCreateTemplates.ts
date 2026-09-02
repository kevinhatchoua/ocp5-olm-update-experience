function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "example";
}

export function parseCreateLabel(label: string): string {
  return label.replace(/^Create\s+(a\s+)?/i, "").trim();
}

export function getPrototypeCreateYaml(kind: string, name = "example"): string {
  const id = slug(name);
  const templates: Record<string, string> = {
    Service: `apiVersion: v1
kind: Service
metadata:
  name: ${id}
  namespace: default
spec:
  selector:
    app: ${id}
  ports:
    - port: 8080
      targetPort: 8080`,
    Route: `apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: ${id}
  namespace: default
spec:
  to:
    kind: Service
    name: ${id}
  port:
    targetPort: 8080`,
    Ingress: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${id}
  namespace: default
spec:
  rules:
    - host: ${id}.apps.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${id}
                port:
                  number: 8080`,
    NetworkPolicy: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${id}
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress`,
    MultiNetworkPolicy: `apiVersion: k8s.ovn.org/v1
kind: MultiNetworkPolicy
metadata:
  name: ${id}
  namespace: default
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress`,
    Deployment: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${id}
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${id}
  template:
    metadata:
      labels:
        app: ${id}
    spec:
      containers:
        - name: ${id}
          image: quay.io/example/${id}:latest`,
    Pod: `apiVersion: v1
kind: Pod
metadata:
  name: ${id}
  namespace: default
spec:
  containers:
    - name: ${id}
      image: quay.io/example/${id}:latest`,
    Job: `apiVersion: batch/v1
kind: Job
metadata:
  name: ${id}
  namespace: default
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: ${id}
          image: quay.io/example/${id}:latest`,
    CronJob: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${id}
  namespace: default
spec:
  schedule: "0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: ${id}
              image: quay.io/example/${id}:latest`,
    DaemonSet: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ${id}
  namespace: default
spec:
  selector:
    matchLabels:
      app: ${id}
  template:
    metadata:
      labels:
        app: ${id}
    spec:
      containers:
        - name: ${id}
          image: quay.io/example/${id}:latest`,
    StatefulSet: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${id}
  namespace: default
spec:
  serviceName: ${id}
  replicas: 1
  selector:
    matchLabels:
      app: ${id}
  template:
    metadata:
      labels:
        app: ${id}
    spec:
      containers:
        - name: ${id}
          image: quay.io/example/${id}:latest`,
    Namespace: `apiVersion: v1
kind: Namespace
metadata:
  name: ${id}`,
    ResourceQuota: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: ${id}
  namespace: default
spec:
  hard:
    pods: "10"`,
    LimitRange: `apiVersion: v1
kind: LimitRange
metadata:
  name: ${id}
  namespace: default
spec:
  limits:
    - type: Container
      default:
        cpu: 500m
        memory: 512Mi`,
    CustomResourceDefinition: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: examples.example.com
spec:
  group: example.com
  names:
    kind: Example
    plural: examples
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true`,
    CRD: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: examples.example.com
spec:
  group: example.com
  names:
    kind: Example
    plural: examples
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true`,
    User: `apiVersion: user.openshift.io/v1
kind: User
metadata:
  name: ${id}`,
    Build: `apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: ${id}
  namespace: default
spec:
  source:
    git:
      uri: https://github.com/example/${id}.git
  strategy:
    type: Source`,
    Volume: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${id}
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi`,
    Template: `apiVersion: template.openshift.io/v1
kind: Template
metadata:
  name: ${id}
  namespace: openshift
objects: []`,
    BootableVolume: `apiVersion: cdi.kubevirt.io/v1beta1
kind: DataVolume
metadata:
  name: ${id}
  namespace: openshift-cnv
spec:
  source:
    registry:
      url: docker://quay.io/example/${id}:latest`,
    MigrationPolicy: `apiVersion: migrations.kubevirt.io/v1alpha1
kind: MigrationPolicy
metadata:
  name: ${id}`,
  };

  const key = Object.keys(templates).find((entry) => entry.toLowerCase() === kind.toLowerCase());
  if (key) return templates[key];

  const safeKind = kind.replace(/[^a-zA-Z0-9]/g, "") || "Resource";
  return `apiVersion: v1
kind: ${safeKind}
metadata:
  name: ${id}
  namespace: default`;
}
