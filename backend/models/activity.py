from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Activity(Base):
    __tablename__ = "activities"

    __table_args__ = (
        CheckConstraint(
            "estimated_cost >= 0",
            name="ck_activity_cost_non_negative",
        ),
        CheckConstraint(
            "duration_hours > 0",
            name="ck_activity_duration_positive",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    city_id: Mapped[int] = mapped_column(
        ForeignKey(
            "cities.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    duration_hours: Mapped[float] = mapped_column(
        nullable=False,
    )

    estimated_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    city = relationship(
        "City",
        back_populates="activities",
    )

    trip_activities = relationship(
        "TripActivity",
        back_populates="activity",
    )