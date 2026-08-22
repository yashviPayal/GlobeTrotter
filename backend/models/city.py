from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    region: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    cost_index: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False
    )

    popularity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    activities = relationship(
        "Activity",
        back_populates="city",
        cascade="all, delete-orphan"
    )

    stops = relationship(
        "TripStop",
        back_populates="city"
    )