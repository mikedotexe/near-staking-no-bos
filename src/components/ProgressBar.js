const ProgressBar = ({ value, max }) => {
    const width = (value / max) * 100;

    const containerStyle = {
        // Adding a subtle shadow for depth
        boxShadow: "0 3px 6px rgba(0, 0, 0, 0.6)",
        border: "1px solid #000",
        backgroundColor: "#f2f1e9", // Off-white primary
        padding: "1px",
        height: "23px",
        width: "100%",
        borderRadius: "6px",
        overflow: "hidden",
        display: "flex",
    };

    let progressBarStyle = {
        height: "100%",
        width: `${width}%`,
        background: "linear-gradient(90deg, rgba(151, 151, 255, 1) 0%, rgba(115, 115, 255, 1) 100%)", // Gradient effect
        boxShadow: "0 0 10px rgba(115, 115, 255, 0.75)", // Glowing effect
        // transition: "width 0.3s cubic-bezier(0.3, -0.3, 0.3, 0.6)",
        transition: "width 0.3s ease-in",
        borderRadius: "6px", // Rounded corners for the progress
        display: "block",
    };

    return (
        <div style={containerStyle}>
            <div style={progressBarStyle}></div>
        </div>
    );
}

export default ProgressBar
