from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    city_id: Mapped[int] = mapped_column(
        ForeignKey("cities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    duration_hours: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False
    )

    estimated_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    city = relationship(
        "City",
        back_populates="activities"
    )

    trip_activities = relationship(
        "TripActivity",
        back_populates="activity"
    )