import React from "react";

export const ExpendableButton = ({ isOpen, toggle }) => {
    return (
        <div style={{marginLeft:"4px"}} onClick={toggle}>
            <i class="fa-solid fa-caret-down"
                style={{
                    transform: `rotate(${isOpen ? 0 : 270}deg)`,
                    transition: "all 0.25s",
                }}></i>

        </div>
    );
};