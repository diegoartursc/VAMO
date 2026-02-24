"use client";

import { type ReactNode } from "react";

export interface StepDef {
    key: string;
    icon: ReactNode;
    title: string;
}

interface StepperNavProps {
    steps: StepDef[];
    activeIndex: number;
    completedSteps: Set<string>;
    onStepClick: (index: number) => void;
}

export default function StepperNav({ steps, activeIndex, completedSteps, onStepClick }: StepperNavProps) {
    const progress = Math.round(((completedSteps.size) / steps.length) * 100);

    return (
        <div className="stepper-container">
            {/* Progress bar */}
            <div className="stepper-progress-track">
                <div
                    className="stepper-progress-fill"
                    style={{ width: `${progress}%` }}
                />
                <span className="stepper-progress-label">{progress}% concluído</span>
            </div>

            {/* Steps */}
            <div className="stepper-steps">
                {steps.map((step, i) => {
                    const isActive = i === activeIndex;
                    const isCompleted = completedSteps.has(step.key);
                    const isPast = i < activeIndex;

                    return (
                        <button
                            key={step.key}
                            className={`stepper-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isPast ? "past" : ""}`}
                            onClick={() => onStepClick(i)}
                            type="button"
                        >
                            <span className="stepper-step-number">
                                {isCompleted ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    i + 1
                                )}
                            </span>
                            <span className="stepper-step-label">{step.title}</span>
                            {i < steps.length - 1 && <span className="stepper-step-connector" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* Step navigation buttons */
export function StepperActions({
    activeIndex,
    totalSteps,
    onPrev,
    onNext,
    onSave,
    saving,
    isLastStep,
}: {
    activeIndex: number;
    totalSteps: number;
    onPrev: () => void;
    onNext: () => void;
    onSave: () => void;
    saving: boolean;
    isLastStep: boolean;
}) {
    return (
        <div className="stepper-actions">
            <button
                className="stepper-btn stepper-btn-prev"
                onClick={onPrev}
                disabled={activeIndex === 0}
                type="button"
            >
                ← Anterior
            </button>
            <span className="stepper-step-indicator">
                Etapa {activeIndex + 1} de {totalSteps}
            </span>
            {isLastStep ? (
                <button
                    className="stepper-btn stepper-btn-save"
                    onClick={onSave}
                    disabled={saving}
                    type="button"
                >
                    {saving ? "Publicando..." : "🚀 Publicar"}
                </button>
            ) : (
                <button
                    className="stepper-btn stepper-btn-next"
                    onClick={onNext}
                    type="button"
                >
                    Próximo →
                </button>
            )}
        </div>
    );
}
