# PixiPSD

PSD Loader for PixiJS

## Getting Started

1. Run following command:

    ```sh
    npm install new-birth-toi-company/PixiPSD
    ```

2. Write your program:

    ```ts
    import { Application } from "pixi.js"
    import { PixiPSD } from "PixiPSD"
    // Initialize your PixiJS App
    const app = new Application();

    await app.init({ background: '#1099bb', resizeTo: window });

    document.body.appendChild(app.canvas);

    // Load your PSD file
    const psd = PixiPSD.from("./path/to/file.psd")

    app.stage.addChild(psd.display);
    ```

3. Done!

## Contributing

We welcome contributions of all kinds! Whether it's a bug report, a feature request, documentation improvement, or code contribution, we encourage you to get involved.

- **Found a bug?** Please open an issue. Even small bugs or typos are helpful to us.
- **Have an idea for a new feature?** Please open an issue to discuss it with the community.
- **Want to contribute code?** Please fork the repository, make your changes, and submit a pull request. We appreciate all contributions, big or small.

We appreciate your contributions!
