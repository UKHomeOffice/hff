# Changelog

## [1.0.1] 29-07-2026

### Changed
- Temporarily disabled the real HFF image build/scan jobs in `.github/workflows/build-scan-push.yml` while upstream CVE remediation is in progress.
- Added a temporary `hff/hff-pattern-test` image flow for validating ECR build, scan, and promotion behavior.
- Configured HOFNotProd test image tags to use `pr-{number}-{sha}` on pull requests and `{sha}` on pushes.
- Changed HOFProd promotion to copy the exact HOFNotProd image with `crane copy` so both registries use the same image digest.
